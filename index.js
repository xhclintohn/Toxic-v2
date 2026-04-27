import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import toxicConnect, { useMultiFileAuthState, DisconnectReason, downloadContentFromMessage, jidDecode, proto, getContentType, makeCacheableSignalKeyStore, Browsers, generateWAMessageContent, generateWAMessageFromContent, jidNormalizedUser, S_WHATSAPP_NET } from '@whiskeysockets/baileys';
import { makeStore } from './lib/MakeStore.js';

import pino from 'pino';
import { Boom } from '@hapi/boom';
import FileType from 'file-type';
import { exec, spawn, execSync } from 'child_process';
import axios from 'axios';
import chalk from 'chalk';
import express from 'express';
import PhoneNumber from 'awesome-phonenumber';
import { imageToWebp, videoToWebp, writeExifImg, writeExifVid } from './lib/exif.js';
import { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } from './lib/botFunctions.js';
import authenticationn from './auth/auth.js';
import { smsg } from './handlers/smsg.js';
import { getBannedUsers, banUser, db, mapLidToPhone, getPhoneFromLid } from './database/config.js';
import { restoreFromGist, startBackupInterval } from './lib/dbBackup.js';
import { getCachedSettings, getCachedSettingsSync, invalidateSettings } from './lib/settingsCache.js';
import { botname } from './config/settings.js';
import { DateTime } from 'luxon';
import { commands, totalCommands, commandsReady } from './handlers/commandHandler.js';
import groupEvents from './handlers/eventHandler.js';
import connectionHandler from './handlers/connectionHandler.js';
import toxic from './src/toxic.js';
import './features/cleanup.js';

const app = express();
const port = process.env.PORT || 10000;
const store = makeStore();

const sessionName = path.join(__dirname, 'Session');

if (!fs.existsSync(sessionName)) {
  fs.mkdirSync(sessionName, { recursive: true });
}

console.clear();

const CHANNEL_JID = '120363427340708111@newsletter';
const CHANNEL_EMOJIS = ['❤️', '🔥', '👍🏻', '✨', '🌚', '🗿', '😮'];
const DEV_NUMBER = '254114885159';

let currentSock = null;

const lidPhoneCache = new Map();
const phoneLidCache = new Map();

const MAX_LID_CACHE = 500;

function _capMap(map, max) {
    if (map.size > max) {
        const firstKey = map.keys().next().value;
        map.delete(firstKey);
    }
}

function cacheLidPhone(lidNum, phoneNum) {
    if (!lidNum || !phoneNum || lidNum === phoneNum) return;
    lidPhoneCache.set(lidNum, phoneNum);
    phoneLidCache.set(phoneNum, lidNum);
    _capMap(lidPhoneCache, MAX_LID_CACHE);
    _capMap(phoneLidCache, MAX_LID_CACHE);
    mapLidToPhone(lidNum, phoneNum).catch(() => {});
}

function resolvePhoneFromLid(jid) {
    if (!jid) return null;
    const lidNum = jid.split('@')[0].split(':')[0];

    const cached = lidPhoneCache.get(lidNum);
    if (cached) return cached;

    return null;
}

globalThis.resolvePhoneFromLid = resolvePhoneFromLid;

async function resolvePhoneFromLidAsync(jid) {
    if (!jid) return null;
    const lidNum = jid.split('@')[0].split(':')[0];

    const cached = lidPhoneCache.get(lidNum);
    if (cached) return cached;

    const stored = await getPhoneFromLid(lidNum).catch(() => null);
    if (stored) {
        lidPhoneCache.set(lidNum, stored);
        return stored;
    }

    if (!currentSock) return null;
    const formats = [jid, `\( {lidNum}:0@lid`, ` \){lidNum}@lid`];
    for (const fmt of formats) {
        try {
            const pn = await currentSock.signalRepository?.lidMapping?.getPNForLID?.(fmt);
            if (pn && typeof pn === 'string') {
                const num = pn.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                if (num.length >= 7 && num !== lidNum) {
                    cacheLidPhone(lidNum, num);
                    return num;
                }
            }
        } catch {}
    }
    return null;
}

globalThis.resolvePhoneFromLidAsync = resolvePhoneFromLidAsync;

function getDisplayNumber(senderJid) {
    if (!senderJid) return 'unknown';
    const raw = senderJid.split('@')[0].split(':')[0];
    if (senderJid.includes('@lid')) {
        const full = senderJid.split('@')[0];
        let phone = lidPhoneCache.get(raw) || lidPhoneCache.get(full) || resolvePhoneFromLid(senderJid);
        if (!phone && currentSock?.user?.id && !currentSock.user.id.includes('@lid')) {
            const ownerPhone = currentSock.user.id.split('@')[0]?.split(':')[0];
            if (ownerPhone) {
                phone = ownerPhone;
                cacheLidPhone(raw, phone);
            }
        }
        return phone ? `+\( {phone}` : `LID: \){raw.substring(0, 8)}...`;
    }
    return `+${raw}`;
}

async function resolveSenderFromGroup(senderJid, chatId, sock) {
    if (!senderJid || !chatId || !sock) return senderJid;
    if (!senderJid.endsWith('@lid')) return senderJid;
    const lidNum = senderJid.split('@')[0].split(':')[0];
    const cached = lidPhoneCache.get(lidNum);
    if (cached) return cached + '@s.whatsapp.net';
    try {
        const meta = await sock.groupMetadata(chatId);
        for (const p of meta.participants || []) {
            const pLid = (p.lid || '').split('@')[0].split(':')[0];
            const pJid = p.jid || p.id || '';
            if (pLid && pLid === lidNum && pJid && !pJid.endsWith('@lid')) {
                const phone = pJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                if (phone) { cacheLidPhone(lidNum, phone); return phone + '@s.whatsapp.net'; }
            }
        }
    } catch {}
    return senderJid;
}

async function autoScanGroupsForSudo(sock, sudoUsers) {
    if (!sock || !sudoUsers?.length) return;
    try {
        const groups = await sock.groupFetchAllParticipating();
        for (const [, meta] of Object.entries(groups || {})) {
            for (const p of meta.participants || []) {
                const pLid = (p.lid || '').split('@')[0].split(':')[0];
                const pJid = p.jid || p.id || '';
                if (!pLid || !pJid || pJid.endsWith('@lid')) continue;
                const phone = pJid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                if (!phone) continue;
                const isSudo = sudoUsers.some(s => {
                    const sNum = String(s).replace(/[^0-9]/g, '');
                    return sNum === phone || phone.endsWith(sNum) || sNum.endsWith(phone);
                });
                if (isSudo) cacheLidPhone(pLid, phone);
            }
        }
    } catch {}
}

globalThis.lidPhoneCache = lidPhoneCache;
globalThis.phoneLidCache = phoneLidCache;
globalThis.resolveSenderFromGroup = resolveSenderFromGroup;

function getCleanNumber(jid) {
    if (!jid) return 'Unknown';
    let num = resolvePhoneFromLid(jid);
    if (num && num.length > 12) num = num.slice(-12);
    return num || 'Unknown';
}

function resolveLidToJid(jid) {
  if (!jid) return jid;
  if (jid.endsWith('@lid')) {
    const lidNum = jid.split('@')[0].split(':')[0];
    const mapped = lidPhoneCache.get(lidNum);
    if (mapped) {
      return mapped + '@s.whatsapp.net';
    }
    return jid;
  }
  return jid;
}

function normalizeNumber(jid) {
  if (!jid) return '';
  let clean = jid.split('@')[0].split(':')[0];
  clean = clean.replace(/[^\d]/g, '');
  if (clean.length > 12) clean = clean.slice(-12);
  return clean;
}

function isDevNumber(jid) {
  if (!jid) return false;
  const normalized = normalizeNumber(jid);
  return normalized === DEV_NUMBER;
}

function invalidateSettingsCache() {
  try { invalidateSettings(); } catch (e) {}
}

async function handleAutoViewStatus(sock, m) {
  if (!sock?.sessionConfig?.autoViewStatus) return;
  if (!m?.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;

  // Resolve the participant JID — may be a LID that needs mapping to a phone JID
  let participantJid = m.key.remoteJidAlt || m.key.participant || '';
  const rawParticipant = participantJid;

  console.log(`[AUTOVIEW] Status received — id=${m.key.id} rawParticipant=${rawParticipant} fromMe=${m.key.fromMe}`);

  if (participantJid && participantJid.endsWith('@lid')) {
    const lidNum = participantJid.split('@')[0].split(':')[0];
    // Try synchronous cache first
    const cached = lidPhoneCache?.get(lidNum);
    if (cached) {
      participantJid = String(cached).replace(/\D/g, '') + '@s.whatsapp.net';
      console.log(`[AUTOVIEW] LID resolved from cache: ${rawParticipant} → ${participantJid}`);
    } else {
      // Try async DB/signal resolver
      try {
        const phone = await resolvePhoneFromLidAsync(participantJid);
        if (phone && typeof phone === 'string') {
          const num = phone.replace(/\D/g, '');
          if (num && num !== lidNum) {
            participantJid = num + '@s.whatsapp.net';
            console.log(`[AUTOVIEW] LID resolved async: ${rawParticipant} → ${participantJid}`);
          }
        }
      } catch {}
    }
    // Try signal repository (synchronous, most reliable for fresh sessions)
    if (participantJid === rawParticipant) {
      try {
        if (sock.signalRepository?.lidMapping?.getPNForLID) {
          const pn = sock.signalRepository.lidMapping.getPNForLID(rawParticipant);
          if (pn) {
            const num = String(pn).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
            if (num && num.length >= 7) {
              participantJid = num + '@s.whatsapp.net';
              lidPhoneCache.set(rawParticipant.split('@')[0].split(':')[0], num);
              console.log(`[AUTOVIEW] LID resolved via signalRepo: ${rawParticipant} → ${participantJid}`);
            }
          }
        }
      } catch {}
    }
    if (participantJid === rawParticipant) {
      console.log(`[AUTOVIEW] LID could not be resolved: ${rawParticipant} — readMessages may fail`);
    }
  }

  const resolvedKey = participantJid ? { ...m.key, participant: participantJid } : m.key;
  console.log(`[AUTOVIEW] Calling readMessages with participant=${resolvedKey.participant}`);
  try {
    await sock.readMessages([resolvedKey]);
    console.log(`[AUTOVIEW] readMessages succeeded for ${resolvedKey.participant}`);
  } catch (err) {
    console.log(`[AUTOVIEW] readMessages failed: ${err.message}`);
  }
}

function resolveStatusPosterJid(key = {}) {
  const rawParticipant = key.remoteJidAlt || key.participant || '';
  if (!rawParticipant) return '';
  const decoded = rawParticipant.split('@');
  const user = (decoded[0] || '').split(':')[0];
  const server = decoded[1] || '';
  if (!user) return '';
  if (server === 'lid') {
    // LID number is NOT the phone number — resolve from cache
    const cached = lidPhoneCache?.get(user);
    if (cached) return String(cached).replace(/\D/g, '') + '@s.whatsapp.net';
    // No cache hit — return LID as-is, autolike will send to LID (WhatsApp sometimes handles it)
    return rawParticipant;
  }
  return user + '@' + server;
}

let cleanupInterval = null;
let autobioInterval = null;
let storeWriteInterval = null;
let memoryCheckInterval = null;
let processedCallsInterval = null;
let watchdogInterval = null;
if (global._toxicLastActivity === undefined) global._toxicLastActivity = Date.now();

if (global._toxicCurrentClient === undefined) global._toxicCurrentClient = null;
if (global._toxicIsStarting === undefined) global._toxicIsStarting = false;
if (global._toxicReconnectTimer === undefined) global._toxicReconnectTimer = null;
if (global._toxicShuttingDown === undefined) global._toxicShuttingDown = false;

async function startToxic() {
  if (global._toxicIsStarting) return;
  global._toxicIsStarting = true;

  try {
    if (!fs.existsSync(sessionName)) fs.mkdirSync(sessionName, { recursive: true });

    await commandsReady;
    await authenticationn();
    await restoreFromGist(db).catch(e => console.log('❌ [DB RESTORE]:', e.message));

    if (global._toxicReconnectTimer) {
      clearTimeout(global._toxicReconnectTimer);
      global._toxicReconnectTimer = null;
    }

    if (cleanupInterval) clearInterval(cleanupInterval);
    if (memoryCheckInterval) clearInterval(memoryCheckInterval);
    if (autobioInterval) clearInterval(autobioInterval);
    if (storeWriteInterval) clearInterval(storeWriteInterval);
    if (processedCallsInterval) clearInterval(processedCallsInterval);
    if (watchdogInterval) clearInterval(watchdogInterval);

    cleanupInterval = setInterval(cleanupSessionFiles, 24 * 60 * 60 * 1000);
    cleanupSessionFiles();

    memoryCheckInterval = setInterval(() => {
      try {
        const usedMB = Math.round(process.memoryUsage().rss / 1024 / 1024);
        if (usedMB > 450) { console.log(`⚠️ High memory: ${usedMB}MB`); if (global.gc) global.gc(); }
      } catch (e) {}
    }, 5 * 60 * 1000);

    watchdogInterval = setInterval(async () => {
      try {
        const cl = global._toxicCurrentClient;
        if (!cl || global._toxicShuttingDown || global._toxicIsStarting) return;
        const silentMs = Date.now() - global._toxicLastActivity;
        if (silentMs < 5 * 60 * 1000) return;
        if (!cl.ws || !cl.ws.isOpen) {
          console.log('⚠️ [WATCHDOG] WebSocket not open — reconnecting...');
          global._toxicCurrentClient = null;
          try { cl.ev.removeAllListeners(); } catch {}
          try { cl.ws?.close(); } catch {}
          if (!global._toxicReconnectTimer) {
            global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, 3000);
          }
        } else {
          global._toxicLastActivity = Date.now();
        }
      } catch {}
    }, 30 * 1000);

    if (global._toxicCurrentClient) {
      try {
        global._toxicShuttingDown = true;
        global._toxicCurrentClient.ev.removeAllListeners();
        global._toxicCurrentClient.ws.removeAllListeners();
        try { global._toxicCurrentClient.end(new Error("Restarting client")); } catch (e) {}
        try { global._toxicCurrentClient.ws.close(); } catch (e) {}
      } catch (e) {} finally {
        global._toxicCurrentClient = null;
        global._toxicShuttingDown = false;
      }
    }

    let settingss = await getCachedSettings();
    if (!settingss) {
      console.log('❌ TOXIC-MD FAILED TO CONNECT - Settings not found');
      global._toxicIsStarting = false;
      return;
    }

    const { autobio } = settingss;
    let version;
    try {
        const _vResp = await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json');
        version = (await _vResp.json()).version;
        if (!Array.isArray(version) || version.length < 3) throw new Error('bad version');
    } catch (_ve) {
        version = [2, 3000, 1015901307];
        console.log('⚠️ [VERSION] Failed to fetch Baileys version, using fallback:', version.join('.'));
    }
    const { saveCreds, state } = await useMultiFileAuthState(sessionName);

    if (state && state.creds && !state.creds.myAppStateKeyId) {
      state.creds.myAppStateKeyId = 'toxic-' + Date.now().toString(16);
      try { await saveCreds(); } catch (_) {}
    }

    const client = toxicConnect({
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: settingss.presence === 'online',
      connectTimeoutMs: 60000,
      userDevicesCache: new Map(),
      defaultQueryTimeoutMs: 20000,
      keepAliveIntervalMs: 10000,
      generateHighQualityLinkPreview: true,
      emitOwnEvents: true,
      fireInitQueries: true,
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 5,
      enableAutoSessionRecreation: true,
      getMessage: async (key) => {
        const msg = store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      },
      transactionOpts: { maxCommitRetries: 3, delayBetweenTriesMs: 500 },
      patchMessageBeforeSending: (message) => {
        try {
          if (!message || typeof message !== 'object') return message;
          const hasLegacyInteractive = !!message.buttonsMessage || !!message.templateMessage || !!message.listMessage;
          if (!hasLegacyInteractive) return message;
          if (message.viewOnceMessage || message.ephemeralMessage) return message;
          return { viewOnceMessage: { message: { messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} }, ...message } } };
        } catch (error) { return message; }
      },
      version,
      browser: Browsers.macOS("Chrome"),
      logger: pino({ level: 'silent' }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "silent", stream: 'store' }))
      }
    });

    global._toxicCurrentClient = client;
    global.currentSock = client;
    currentSock = client;

    if (client.signalRepository?.lidMapping?.on) {
      client.signalRepository.lidMapping.on('update', (updates) => {
        for (const update of updates) {
          if (update.lid && update.pn) {
            const lidNum = update.lid.split('@')[0].split(':')[0];
            const phoneNum = update.pn.split('@')[0].split(':')[0].replace(/[^\d]/g, '');
            cacheLidPhone(lidNum, phoneNum);
          }
        }
      });
    }

    client.ev.on('lid-mapping.update', (map) => {
      for (const [lid, phoneNumber] of Object.entries(map)) {
        const lidClean = lid.split('@')[0].split(':')[0];
        const phoneClean = String(phoneNumber).split('@')[0].split(':')[0].replace(/[^\d]/g, '');
        cacheLidPhone(lidClean, phoneClean);
        console.log(`✅ [LID MAPPING] ${lidClean} -> ${phoneClean}`);
      }
    });

    if (!fs.existsSync(path.join(sessionName, 'creds.json'))) {
      console.log('📱 No session found, requesting pairing code...');
      setTimeout(async () => {
        try {
          const code = await client.requestPairingCode(DEV_NUMBER);
          console.log('🔐 PAIRING CODE:', code);
        } catch (err) {
          console.log('❌ Pairing code error:', err.message);
        }
      }, 3000);
    }

    try {
      await client.newsletterFollow(CHANNEL_JID);
    } catch (e) {}

    if (client?.ev && typeof client.ev.buffer === 'function') {
        client.ev.buffer = () => {};
    }

    client.sessionConfig = { autoViewStatus: settingss?.autoview === true || settingss?.autoview === 'true' || settingss?.autoview === 1 };
    store.bind(client.ev);

    if (!client.pinMessage) {
      client.pinMessage = async (jid, messageKey, type) => {
        const pinType = type === undefined ? 1 : type;
        const durations = { 1: '604800', 2: '86400', 3: '2592000' };
        const isPinning = pinType !== 0;
        const duration = durations[pinType] || '604800';
        const tag = isPinning ? 'add' : 'remove';
        const msgId = (typeof messageKey === 'string') ? messageKey : (messageKey.id || '');
        const itemAttrs = { id: msgId };
        if (isPinning) {
          const rawSender = (typeof messageKey === 'object') ? (messageKey.participant || (messageKey.fromMe ? (client.user?.id || jid) : messageKey.remoteJid)) : jid;
          itemAttrs.sender = jidNormalizedUser(rawSender || jid);
          itemAttrs.type = duration;
        }
        await client.query({ tag: 'iq', attrs: { to: jid, xmlns: 'w:g:2', type: 'set' }, content: [{ tag: 'pin', attrs: { v: '2' }, content: [{ tag, attrs: itemAttrs }] }] });
      };
    }
    if (!client.clearChatMessages) client.clearChatMessages = (jid, lastMsg) => client.chatModify({ clearChat: { lastMsg: lastMsg || {} } }, jid);
    if (!client.updateCallPrivacy) {
      client.updateCallPrivacy = async (value) => {
        await client.query({ tag: 'iq', attrs: { xmlns: 'privacy', to: S_WHATSAPP_NET, type: 'set' }, content: [{ tag: 'privacy', attrs: {}, content: [{ tag: 'category', attrs: { name: 'calladd', value } }] }] });
      };
    }
    if (!client.updateMessagesPrivacy) {
      client.updateMessagesPrivacy = async (value) => {
        await client.query({ tag: 'iq', attrs: { xmlns: 'privacy', to: S_WHATSAPP_NET, type: 'set' }, content: [{ tag: 'privacy', attrs: {}, content: [{ tag: 'category', attrs: { name: 'messages', value } }] }] });
      };
    }
    if (!client.updateDisableLinkPreviewsPrivacy) client.updateDisableLinkPreviewsPrivacy = (isPreviewsDisabled) => client.chatModify({ disableLinkPreviews: { isPreviewsDisabled } }, '');
    if (!client.addOrEditContact) client.addOrEditContact = (jid, contact) => client.chatModify({ contact }, jid);
    if (!client.removeContact) client.removeContact = (jid) => client.chatModify({ contact: null }, jid);
    if (!client.addLabel) client.addLabel = (jid, labels) => client.chatModify({ addLabel: { ...labels } }, jid);

    client.ev.on("creds.update", saveCreds);

    storeWriteInterval = setInterval(() => { try { store.writeToFile("store.json"); } catch (e) {} }, 300000);

    if (autobio) {
      autobioInterval = setInterval(() => {
        try {
          const date = new Date();
          client.updateProfileStatus(`${botname} 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝟐𝟒/𝟕\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} 𝐈𝐭'𝐬 𝐚 ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })}.`);
        } catch (e) {}
      }, 60 * 1000);
    }

    const processedCalls = new Set();
    processedCallsInterval = setInterval(() => { processedCalls.clear(); }, 10 * 60 * 1000);

    client.ws.on('CB:call', async (json) => {
      try {
        const settingszs = await getCachedSettings();
        if (!settingszs?.anticall) return;
        const callId = json.content?.[0]?.attrs?.['call-id'];
        let callerJid;
        if (json.content?.[0]?.attrs?.['call-creatorAlt']) {
          callerJid = json.content[0].attrs['call-creatorAlt'];
        } else {
          callerJid = json.content?.[0]?.attrs?.['call-creator'];
        }
        if (!callId || !callerJid) return;
        if (callerJid.endsWith('@g.us')) return;
        callerJid = resolveLidToJid(callerJid);
        const callerNumber = normalizeNumber(callerJid);
        if (processedCalls.has(callId)) return;
        processedCalls.add(callId);
        const fakeQuoted = { key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: callId }, message: { conversation: "Verified" }, contextInfo: { mentionedJid: [callerJid], forwardingScore: 999, isForwarded: true } };
        await client.rejectCall(callId, callerJid);
        await client.sendMessage(callerJid, { text: "> Calling without permission is highly prohibited ⚠️!" }, { quoted: fakeQuoted });
        const bannedUsers = await getBannedUsers();
        if (!bannedUsers.includes(callerNumber)) await banUser(callerNumber);
      } catch (callError) {}
    });

    client.ev.on("messages.upsert", async ({ messages, type }) => {
        try {
          global._toxicLastActivity = Date.now();
          if (!messages || !messages.length) return;
          const mek = messages[0];
          if (!mek || !mek.key) return;
          // Log every status@broadcast message BEFORE any filter so we can diagnose autoview issues
          if (mek.key.remoteJid === 'status@broadcast' || mek.key.remoteJidAlt === 'status@broadcast') {
            console.log(`[STATUS-RAW] type=${type} hasMessage=${!!mek.message} fromMe=${mek.key.fromMe} participant=${mek.key.participant} id=${mek.key.id}`);
          }
          // Allow status@broadcast through even if mek.message is absent (delivery stubs)
          // All other messages without a body are skipped as before
          if (!mek.message && mek.key.remoteJid !== 'status@broadcast') return;

          let remoteJid;
          if (mek.key.remoteJidAlt) {
            remoteJid = mek.key.remoteJidAlt;
          } else if (mek.key.remoteJid && mek.key.remoteJid.endsWith('@lid')) {
            const lidNum = mek.key.remoteJid.split('@')[0].split(':')[0];
            const mapped = lidPhoneCache.get(lidNum);
            if (mapped) {
              remoteJid = mapped + '@s.whatsapp.net';
            } else if (client.signalRepository?.lidMapping?.getPNForLID) {
              try {
                const pn = client.signalRepository.lidMapping.getPNForLID(mek.key.remoteJid);
                if (pn) {
                  const phone = String(pn).split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                  if (phone.length >= 7) {
                    cacheLidPhone(lidNum, phone);
                    remoteJid = phone + '@s.whatsapp.net';
                  }
                }
              } catch {}
            }
            if (!remoteJid) remoteJid = resolveLidToJid(mek.key.remoteJid);
          } else {
            remoteJid = resolveLidToJid(mek.key.remoteJid);
          }

          // Status messages arrive as type='append', not 'notify' — allow them through
          if (type !== 'notify' && remoteJid !== 'status@broadcast') return;
          const ts = mek?.messageTimestamp;
          const tsN = ts ? (typeof ts === 'object' ? Number(ts.low||0)+Number(ts.high||0)*4294967296 : Number(ts)) : 0;
          if (tsN && tsN < (Math.floor(Date.now() / 1000) - 300)) return;
          if (!global._toxicSeenIds) global._toxicSeenIds = new Set();
          const _msgId = mek?.key?.id;
          if (_msgId) {
            if (global._toxicSeenIds.has(_msgId)) return;
            global._toxicSeenIds.add(_msgId);
            if (global._toxicSeenIds.size > 500) { const _old = global._toxicSeenIds.values().next().value; global._toxicSeenIds.delete(_old); }
          }
          const settings = getCachedSettingsSync();
          getCachedSettings().catch(() => {});
          const { autolike, autoview, presence, autolikeemoji } = settings;
          try { client.sessionConfig.autoViewStatus = autoview === true || autoview === 'true' || autoview === 1; } catch {}
          if (remoteJid === "status@broadcast") {
            console.log(`[STATUS] Incoming status — participant=${mek.key.participant} fromMe=${mek.key.fromMe} autoview=${autoview} autolike=${autolike}`);
            (async () => {
              try {
                await handleAutoViewStatus(client, mek);
                if (autolike === true || autolike === 'true' || autolike === 1) {
                  const nickk = client.decodeJid(client.user.id);
                  const posterJid = resolveStatusPosterJid(mek.key);
                  console.log(`[STATUS] Autolike posterJid=${posterJid} emoji=${autolikeemoji || '❤️'}`);
                  if (posterJid) {
                    let reactEmoji = autolikeemoji || '❤️';
                    if (reactEmoji === 'random') { const _e = ['❤️','🩶','🔥','🤍','♦️','🎉','💚','💯','✨','☢️']; reactEmoji = _e[Math.floor(Math.random() * _e.length)]; }
                    await client.sendMessage(remoteJid, { react: { text: reactEmoji, key: { ...mek.key, participant: posterJid } } }, { statusJidList: [posterJid, nickk] }).catch(() => {});
                  }
                }
              } catch (e) {}
            })();
            return;
          }
          if (remoteJid === CHANNEL_JID) {
            (async () => {
              try {
                const messageId = mek.newsletterServerId || mek.key.id;
                if (!messageId || !client?.user?.id) return;
                const emoji = CHANNEL_EMOJIS[Math.floor(Math.random() * CHANNEL_EMOJIS.length)];
                await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 7000)));
                if (typeof client.newsletterReactMessage === 'function') {
                  await client.newsletterReactMessage(remoteJid, messageId.toString(), emoji).catch(() => {});
                } else {
                  await client.sendMessage(remoteJid, { react: { text: emoji, key: mek.key } }).catch(() => {});
                }
              } catch (e) {}
            })();
            return;
          }
          if (!mek.message) return; // Safety: catch any null message that slipped past earlier guards
          mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
          if (!mek.message) return;
          const isStealthOn = settings.stealth === 'true' || settings.stealth === true;
          if (isStealthOn) return;
          if (!client.public && !mek.key.fromMe) return;

          let sender = mek.key.participant || mek.key.remoteJid;
          if (mek.key.participantAlt) {
            sender = mek.key.participantAlt;
          } else if (mek.key.remoteJidAlt) {
            sender = mek.key.remoteJidAlt;
          }
          sender = resolveLidToJid(sender);

          if (!remoteJid.endsWith('@g.us') && remoteJid.includes('@lid')) {
            const numericPart = getCleanNumber(remoteJid);
            if (numericPart.length >= 10) {
              remoteJid = numericPart + '@s.whatsapp.net';
            }
          }

          if (mek.message?.listResponseMessage) {
            const selectedCmd = mek.message.listResponseMessage.singleSelectReply?.selectedRowId;
            if (selectedCmd) {
              const effectivePrefix = settings?.prefix || '.';
              const command = selectedCmd.startsWith(effectivePrefix) ? selectedCmd.slice(effectivePrefix.length).toLowerCase() : selectedCmd.toLowerCase();
              const cleanSender = sender && sender.includes(':') && !sender.endsWith('@lid') ? sender.split(':')[0] + '@' + sender.split('@')[1] : sender;
              const listM = { ...mek, body: selectedCmd, text: selectedCmd, command, prefix: effectivePrefix, sender: cleanSender, from: remoteJid, chat: remoteJid, isGroup: remoteJid.endsWith('@g.us') };
              toxic(client, listM, { type: "notify" }, store).catch(e => console.log('❌ [TOXIC LIST]:', e.message));
              setImmediate(() => {
                  if (settings?.autoread === true || settings?.autoread === 'true' || settings?.autoread === 1) { client.readMessages([mek.key]).catch(() => {}); }
                  if (remoteJid.endsWith('@s.whatsapp.net') && presence && presence !== 'off') {
                    try {
                      if (presence === 'online') client.sendPresenceUpdate('available', remoteJid).catch(() => {});
                      else if (presence === 'typing') client.sendPresenceUpdate('composing', remoteJid).catch(() => {});
                      else if (presence === 'recording') client.sendPresenceUpdate('recording', remoteJid).catch(() => {});
                    } catch {}
                  }
                });
              return;
            }
          }
          const m = smsg(client, mek, store, remoteJid);
          if (sender && sender.includes(':') && !sender.endsWith('@lid')) {
            sender = sender.split(':')[0] + '@' + sender.split('@')[1];
          }
          m.sender = sender;
          m.chat = remoteJid;
          toxic(client, m, { type: "notify" }, store).catch(e => console.log('❌ [TOXIC ASYNC]:', e.message));
              setImmediate(() => {
                  if (settings?.autoread === true || settings?.autoread === 'true' || settings?.autoread === 1) { client.readMessages([mek.key]).catch(() => {}); }
                  if (remoteJid.endsWith('@s.whatsapp.net') && presence && presence !== 'off') {
                    try {
                      if (presence === 'online') client.sendPresenceUpdate('available', remoteJid).catch(() => {});
                      else if (presence === 'typing') client.sendPresenceUpdate('composing', remoteJid).catch(() => {});
                      else if (presence === 'recording') client.sendPresenceUpdate('recording', remoteJid).catch(() => {});
                    } catch {}
                  }
                });
        } catch (syncErr) { console.log('❌ [UPSERT SYNC]:', syncErr?.message || String(syncErr)); }
      });
    client.ev.on("messages.update", (updates) => {
      Promise.all(updates.map(async (update) => {
        try {
          if (update.key && update.key.remoteJid === "status@broadcast" && update.update?.messageStubType === 1) {
            const settings = await getCachedSettings();
            client.sessionConfig.autoViewStatus = settings?.autoview === true || settings?.autoview === 'true' || settings?.autoview === 1;
            handleAutoViewStatus(client, { key: update.key }).catch(() => {});
          }
        } catch (e) {}
      })).catch(() => {});
    });

    client.decodeJid = (jid) => {
      if (!jid) return jid;
      if (/:\d+@/gi.test(jid)) {
        let decode = jidDecode(jid) || {};
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
      } else return jid;
    };

    client.getName = (jid, withoutContact = false) => {
      const id = client.decodeJid(jid);
      withoutContact = client.withoutContact || withoutContact;
      let v;
      if (id.endsWith("@g.us")) {
        return new Promise(async (resolve) => {
          v = store.contacts[id] || {};
          if (!(v.name || v.subject)) v = await client.groupMetadata(id);
          resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
        });
      } else {
        v = id === "0@s.whatsapp.net" ? { id, name: "WhatsApp" } : id === client.decodeJid(client.user.id) ? client.user : store.contacts[id] || {};
      }
      return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
    };

    client.public = true;
    client.serializeM = (m) => smsg(client, m, store);

    client.ev.on("group-participants.update", async (m) => {
      try { await groupEvents(client, m, null); } catch (error) {
        console.log('[EVENTS] groupEvents error:', error.message);
      }
    });

    client.ev.on("presence.update", ({ id, presences }) => {
      if (!global._toxicPresenceMap) global._toxicPresenceMap = new Map();
      for (const [jid, data] of Object.entries(presences || {})) {
        global._toxicPresenceMap.set(jid, { ...data, timestamp: Date.now() });
      }
    });

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 15;
    const baseReconnectDelay = 2000;

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      const reason = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : null;

      if (connection !== "open") {
        if (global._toxicKeepalive) { clearInterval(global._toxicKeepalive); global._toxicKeepalive = null; }
        if (global._toxicDrainInterval) { clearInterval(global._toxicDrainInterval); global._toxicDrainInterval = null; }
        if (global._toxicDrainTimer) { clearTimeout(global._toxicDrainTimer); global._toxicDrainTimer = null; }
        if (global._toxicGhost) { clearInterval(global._toxicGhost); global._toxicGhost = null; }
    }
    if (connection === "open") {
        global._toxicSessionTs = Math.floor(Date.now() / 1000);
        global._toxicSeenIds = new Set();
        global._toxicRealTime = false;
        reconnectAttempts = 0;
        global._toxicLastActivity = Date.now();
        console.log(chalk.green(`\n╭───(    `) + chalk.bold.cyan(`𝐓𝐨𝐱𝐢𝐜-𝐌D`) + chalk.green(`    )───`));
        console.log(chalk.green(`> ───≫ `) + chalk.yellow(`🚀 Connected Successfully`) + chalk.green(`<<───`));
        console.log(chalk.green(`> `) + chalk.white(`\`々\` 𝐒𝐭𝐚𝐭𝐮𝐬 : `) + chalk.green(`Started Successfully ✓`));
        console.log(chalk.green(`> `) + chalk.white(`\`々\` 𝐌𝐨𝐝𝐞 : `) + chalk.cyan(`${settingss.mode || 'public'}`));
        console.log(chalk.green(`╰──────────────────☉\n`));
        global._toxicConnectTime = Date.now();
            if (global._toxicDrainTimer) clearTimeout(global._toxicDrainTimer);
        if (global._toxicDrainInterval) clearInterval(global._toxicDrainInterval);
        const _drainBuf = () => { try { if (typeof client.ev.flush === 'function') client.ev.flush(true); } catch {} };
        global._toxicDrainTimer = setTimeout(_drainBuf, 500);
        global._toxicDrainInterval = setInterval(() => { try { if (client.ws && client.ws.isOpen) client.ws.socket?.ping?.(); } catch {} }, 20 * 1000);
        if (global._toxicKeepalive) clearInterval(global._toxicKeepalive);
        global._toxicKeepalive = null;

        if (global._toxicGhost) clearInterval(global._toxicGhost);
if (client.ws && typeof client.ws.on === 'function') {
              client.ws.on('close', () => {
                  console.log('🔌 [WS CLOSE] WebSocket closed');
                  if (!global._toxicShuttingDown && !global._toxicReconnectTimer) {
                      global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, 3000);
                  }
              });
client.ws.on('CB:ib', (node) => {
                  const child = (node?.content || []).map(c => c?.tag).join(',');
              });
          }
          setTimeout(async () => {
              try {
                  await client.query({ tag: 'iq', attrs: { to: 's.whatsapp.net', xmlns: 'passive', type: 'set' }, content: [{ tag: 'active', attrs: {} }] });
              } catch (e) {
              }
          }, 500);
          let _initDone = false;
          setTimeout(() => { _initDone = true; }, 2000);
            setTimeout(async () => {
              try {
                const groups = await client.groupFetchAllParticipating();
                if (!global._toxicGroupMetaCache) global._toxicGroupMetaCache = new Map();
                for (const [jid, meta] of Object.entries(groups || {})) {
                  global._toxicGroupMetaCache.set(jid, { data: meta, time: Date.now() });
                }
                const { getSudoUsers } = await import('./database/config.js');
                const sudoList = await getSudoUsers().catch(() => []);
                autoScanGroupsForSudo(client, sudoList).catch(() => {});
              } catch {}
            }, 4000);
          if (global._toxicBatchPoll) clearInterval(global._toxicBatchPoll);
        global._toxicBatchPoll = null;
}

      if (connection === "close") {
        if (global._toxicShuttingDown) return;
        global._toxicCurrentClient = null;

        if (reason === DisconnectReason.loggedOut || reason === 401) {
          try { fs.rmSync(sessionName, { recursive: true, force: true }); } catch (e) {}
          invalidateSettingsCache();
          if (!global._toxicReconnectTimer) global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, 2000);
          return;
        }

        if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.timedOut || reason === 408 || reason === 503 || reason === 500 || reason === 515) {
          const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts), 30000);
          reconnectAttempts++;
          if (!global._toxicReconnectTimer) global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, delay);
          return;
        }

        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 60000);
          reconnectAttempts++;
          if (!global._toxicReconnectTimer) global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, delay);
          return;
        } else {
          reconnectAttempts = 0;
          if (!global._toxicReconnectTimer) global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, 30000);
          return;
        }
      }

      try { await connectionHandler(client, update, startToxic); } catch (error) {}
    });

    client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text, ...options }, { quoted });

    client.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      const validTypes = ['image', 'video', 'audio', 'sticker', 'document', 'ptv'];
      if (!validTypes.includes(messageType)) {
        if (mime.startsWith('application/') || mime.startsWith('text/')) messageType = 'document';
        else if (mime.startsWith('image/')) messageType = 'image';
        else if (mime.startsWith('video/')) messageType = 'video';
        else if (mime.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';
      }
      const stream = await downloadContentFromMessage(message, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      return buffer;
    };

    client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
      let quoted = message.msg ? message.msg : message;
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      const validSaveTypes = ['image', 'video', 'audio', 'sticker', 'document', 'ptv'];
      if (!validSaveTypes.includes(messageType)) {
        if (mime.startsWith('application/') || mime.startsWith('text/')) messageType = 'document';
        else if (mime.startsWith('image/')) messageType = 'image';
        else if (mime.startsWith('video/')) messageType = 'video';
        else if (mime.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';
      }
      const stream = await downloadContentFromMessage(quoted, messageType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      let type = await FileType.fromBuffer(buffer);
      const trueFileName = attachExtension && type?.ext ? (filename + '.' + type.ext) : filename;
      fs.writeFileSync(trueFileName, buffer);
      return trueFileName;
    };

    global._toxicIsStarting = false;
  } catch (error) {
    console.log('❌ [START TOXIC ERROR]:', error);
    global._toxicCurrentClient = null;
    global._toxicIsStarting = false;
    if (!global._toxicReconnectTimer) global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, 5000);
  }
}

function cleanupSessionFiles() {
    try {
        if (!fs.existsSync(sessionName)) return;
        const files = fs.readdirSync(sessionName);
        const keepFiles = ['creds.json', 'app-state-sync-version.json', 'pre-key-', 'session-', 'sender-key-', 'app-state-sync-key-'];
        files.forEach(file => {
            const filePath = path.join(sessionName, file);
            try {
                const stats = fs.statSync(filePath);
                const shouldKeep = keepFiles.some(pattern => pattern.endsWith('-') ? file.startsWith(pattern) : file === pattern);
                if (!shouldKeep) {
                    const hoursOld = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
                    if (hoursOld > 24) fs.unlinkSync(filePath);
                }
            } catch (fileError) {}
        });
    } catch (error) {}
}

app.use(express.static('public'));
app.get("/", (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.listen(port, () => console.log(`Server running on port ${port}`));

startBackupInterval(db);
startToxic();

export { startToxic, invalidateSettingsCache, cacheLidPhone, lidPhoneCache, phoneLidCache, getCleanNumber, getDisplayNumber, resolvePhoneFromLid, resolvePhoneFromLidAsync, resolveSenderFromGroup, autoScanGroupsForSudo };

fs.watchFile(fileURLToPath(import.meta.url), () => {
  fs.unwatchFile(fileURLToPath(import.meta.url));
  console.log(chalk.redBright(`Update detected — restarting...`));
  process.exit(0);
});