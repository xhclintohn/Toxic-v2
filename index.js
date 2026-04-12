const {
  default: toxicConnect,
  useMultiFileAuthState,
  DisconnectReason,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
  makeCacheableSignalKeyStore,
  Browsers,
  generateWAMessageContent,
  generateWAMessageFromContent,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const FileType = require("file-type");
const { exec, spawn, execSync } = require("child_process");
const axios = require("axios");
const chalk = require("chalk");
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('./lib/botFunctions');
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

const authenticationn = require('./auth/auth.js');
require('./features/cleanup');
const { smsg } = require('./handlers/smsg');
const { getBannedUsers, banUser, db } = require("./database/config");
const { restoreFromGist, startBackupInterval } = require('./lib/dbBackup');
const { getCachedSettings, getCachedSettingsSync, invalidateSettings } = require('./lib/settingsCache');
const { botname } = require('./config/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('./handlers/commandHandler');
const path = require('path');

const sessionName = path.join(__dirname, 'Session');

if (!fs.existsSync(sessionName)) {
  fs.mkdirSync(sessionName, { recursive: true });
}

const groupEvents = require("./handlers/eventHandler");
const connectionHandler = require('./handlers/connectionHandler');

const CHANNEL_JID = '120363427340708111@newsletter';
const CHANNEL_EMOJIS = ['❤️', '🔥', '👍🏻', '✨', '🌚', '🗿', '😮'];

process.on("unhandledRejection", (reason) => {
  console.log('❌ [UNHANDLED REJECTION]:', reason?.message || String(reason));
});

process.on("uncaughtException", (error) => {
  console.log('❌ [UNCAUGHT EXCEPTION]:', error?.message || String(error));
});

function invalidateSettingsCache() {
  try { invalidateSettings(); } catch (e) {}
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

async function handleAutoViewStatus(sock, m) {
  if (!sock?.sessionConfig?.autoViewStatus) return;
  if (!m?.key) return;
  if (m.key.remoteJid !== 'status@broadcast') return;
  const isLid = m.key.addressingMode === 'lid';
  const resolvedKey = isLid ? { ...m.key, participant: m.key.remoteJidAlt || m.key.participant } : m.key;
  try { await sock.readMessages([resolvedKey]); } catch (err) {}
}

function resolveStatusPosterJid(key = {}) {
  const rawParticipant = key.remoteJidAlt || key.participant || '';
  if (!rawParticipant) return '';
  const decoded = rawParticipant.split('@');
  const user = (decoded[0] || '').split(':')[0];
  const server = decoded[1] || '';
  if (!user) return '';
  if (server === 'lid') return user + '@s.whatsapp.net';
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
        if (silentMs < 8 * 60 * 1000) return;
        try {
          await Promise.race([
            cl.sendPresenceUpdate('available'),
            new Promise((_, rej) => setTimeout(() => rej(new Error('ping timeout')), 15000))
          ]);
          global._toxicLastActivity = Date.now();
        } catch {
          console.log('⚠️ [WATCHDOG] Connection appears dead — reconnecting...');
          global._toxicCurrentClient = null;
          try { cl.ev.removeAllListeners(); } catch {}
          try { cl.ws.close(); } catch {}
          if (!global._toxicReconnectTimer) {
            global._toxicReconnectTimer = setTimeout(() => { global._toxicReconnectTimer = null; startToxic(); }, 3000);
          }
        }
      } catch {}
    }, 3 * 60 * 1000);

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

    // FIX: toxic-baileys opens ev.buffer() in chats.js when receivedPendingNotifications
    // fires without myAppStateKeyId in creds — that buffer never closes if appStateSyncKeyShare
    // never arrives. Setting any truthy placeholder prevents the buffer from being opened at all.
    if (state && state.creds && !state.creds.myAppStateKeyId) {
      state.creds.myAppStateKeyId = 'toxic-' + Date.now().toString(16);
      console.log('🔑 [CREDS] myAppStateKeyId set — event buffer deadlock prevented');
      try { await saveCreds(); } catch (_) {}
    }

    const client = toxicConnect({
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: !(settingss.presence === 'offline' || settingss.presence === 'unavailable'),
      connectTimeoutMs: 60000,
      userDevicesCache: new Map(),
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 25000,
      generateHighQualityLinkPreview: true,
      emitOwnEvents: true,
      fireInitQueries: true,
      retryRequestDelayMs: 3000,
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

    client.sessionConfig = { autoViewStatus: settingss?.autoview === true || settingss?.autoview === 'true' };
    global._toxicCurrentClient = client;
    store.bind(client.ev);

    if (!client.pinMessage) {
      client.pinMessage = async (jid, messageKey, type) => {
        const { jidNormalizedUser } = require('@whiskeysockets/baileys');
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
        const { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
        await client.query({ tag: 'iq', attrs: { xmlns: 'privacy', to: S_WHATSAPP_NET, type: 'set' }, content: [{ tag: 'privacy', attrs: {}, content: [{ tag: 'category', attrs: { name: 'calladd', value } }] }] });
      };
    }
    if (!client.updateMessagesPrivacy) {
      client.updateMessagesPrivacy = async (value) => {
        const { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
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
        const callerJid = json.content?.[0]?.attrs?.['call-creator'];
        if (!callId || !callerJid) return;
        if (callerJid.endsWith('@g.us')) return;
        const callerNumber = callerJid.replace(/[@.a-z]/g, "");
        if (processedCalls.has(callId)) return;
        processedCalls.add(callId);
        const fakeQuoted = { key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: callId }, message: { conversation: "Verified" }, contextInfo: { mentionedJid: [callerJid], forwardingScore: 999, isForwarded: true } };
        await client.rejectCall(callId, callerJid);
        await client.sendMessage(callerJid, { text: "> Calling without permission is highly prohibited ⚠️!" }, { quoted: fakeQuoted });
        const bannedUsers = await getBannedUsers();
        if (!bannedUsers.includes(callerNumber)) await banUser(callerNumber);
      } catch (callError) {}
    });

    client.ev.on("messages.upsert", async ({ messages = [], type } = {}) => {
      try {
      global._toxicLastActivity = Date.now();
      const _ct = global._toxicConnectTime || 0;
      const hasRecent = messages.some(msg => {
        const ts = msg.messageTimestamp;
        if (!ts) return type === 'notify';
        const tsNum = typeof ts === 'object' ? Number(ts.low || 0) + Number(ts.high || 0) * 4294967296 : Number(ts);
        return _ct > 0 ? tsNum * 1000 >= _ct - 10000 : (Date.now() - tsNum * 1000) < 45000;
      });
      if (!hasRecent) return;

      const _fastSettings = getCachedSettingsSync();
      const _fastPresence = _fastSettings?.presence;
      const _fastStealth = _fastSettings?.stealth === 'true' || _fastSettings?.stealth === true;
      if (!_fastStealth && _fastPresence && _fastPresence !== 'offline' && _fastPresence !== 'unavailable') {
        for (const _fmek of messages) {
          const _fjid = _fmek.key?.remoteJid;
          if (_fjid?.endsWith('@s.whatsapp.net') && !_fmek.key?.fromMe && _fmek.message) {
            if (_fastPresence === 'typing') client.sendPresenceUpdate('composing', _fjid).catch(() => {});
            else if (_fastPresence === 'recording') client.sendPresenceUpdate('recording', _fjid).catch(() => {});
            else client.sendPresenceUpdate('available', _fjid).catch(() => {});
          }
        }
      }

      let settings = _fastSettings;
      getCachedSettings().catch(() => {});

      client.sessionConfig.autoViewStatus = settings?.autoview === true || settings?.autoview === 'true';
      const { autoread, autolike, autoview, presence, autolikeemoji, stealth } = settings;
      const isStealthOn = stealth === 'true' || stealth === true;

      await Promise.all(messages.map(async (mek) => {
        try {
          if (!mek || !mek.key) return;
          const remoteJid = mek.key.remoteJid;

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

          if (remoteJid === "status@broadcast") {
            (async () => {
              try {
                const isAutolike = autolike === true || autolike === 'true';
                await handleAutoViewStatus(client, mek);
                const posterJid = resolveStatusPosterJid(mek.key);
                if (isAutolike && posterJid) {
                  const nickk = client.decodeJid(client.user.id);
                  let reactEmoji = autolikeemoji || '❤️';
                  if (reactEmoji === 'random') {
                    const emojis = ['❤️', '🩶', '🔥', '🤍', '♦️', '🎉', '💚', '💯', '✨', '☢️'];
                    reactEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                  }
                  const reactKey = { ...mek.key, participant: posterJid };
                  await client.sendMessage(remoteJid, { react: { text: reactEmoji, key: reactKey } }, { statusJidList: [posterJid, nickk] }).catch(() => {});
                }
              } catch (e) {}
            })();
            return;
          }

          if (!mek.message) return;
          mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;
          if (!mek.message) return;

          if (isStealthOn) return;

          if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
            client.readMessages([mek.key]).catch(() => {});
          }

          if (remoteJid.endsWith('@s.whatsapp.net')) {
            try {
              if (presence === 'online') client.sendPresenceUpdate("available", remoteJid).catch(() => {});
              else if (presence === 'typing') client.sendPresenceUpdate("composing", remoteJid).catch(() => {});
              else if (presence === 'recording') client.sendPresenceUpdate("recording", remoteJid).catch(() => {});
            } catch (error) {}
          }

          if (!client.public && !mek.key.fromMe) return;

          if (mek.message?.listResponseMessage) {
            const selectedCmd = mek.message.listResponseMessage.singleSelectReply?.selectedRowId;
            if (selectedCmd) {
              const effectivePrefix = settings?.prefix || '.';
              let command = selectedCmd.startsWith(effectivePrefix) ? selectedCmd.slice(effectivePrefix.length).toLowerCase() : selectedCmd.toLowerCase();
              const listM = { ...mek, body: selectedCmd, text: selectedCmd, command, prefix: effectivePrefix, sender: mek.key.remoteJid, from: mek.key.remoteJid, chat: mek.key.remoteJid, isGroup: mek.key.remoteJid.endsWith('@g.us') };
              require("./src/toxic")(client, listM, { type: "notify" }, store).catch(e => console.log('❌ [TOXIC LIST]:', e.message));
              return;
            }
          }

          try {
            const m = smsg(client, mek, store);
            require("./src/toxic")(client, m, { type: "notify" }, store).catch(e => console.log('❌ [TOXIC ASYNC]:', e.message));
          } catch (error) { console.log('❌ [TOXIC SYNC]:', error.message); }
        } catch (loopError) { console.log('❌ [LOOP ERROR]:', loopError?.message || String(loopError)); }
      }));
      } catch (outerErr) { console.log('❌ [UPSERT OUTER]:', outerErr?.message || String(outerErr)); }
    });

    client.ev.on("messages.update", (updates) => {
      Promise.all(updates.map(async (update) => {
        try {
          if (update.key && update.key.remoteJid === "status@broadcast" && update.update?.messageStubType === 1) {
            const settings = await getCachedSettings();
            client.sessionConfig.autoViewStatus = settings?.autoview === true || settings?.autoview === 'true';
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
      try { groupEvents(client, m, null); } catch (error) {}
    });

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 15;
    const baseReconnectDelay = 2000;

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      const reason = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : null;

      if (connection !== "open") {
        if (global._toxicKeepalive) { clearInterval(global._toxicKeepalive); global._toxicKeepalive = null; }
        if (global._toxicGhost) { clearInterval(global._toxicGhost); global._toxicGhost = null; }
    }
    if (connection === "open") {
        reconnectAttempts = 0;
        global._toxicLastActivity = Date.now();
        try { require("./src/toxic").prewarmCache(); } catch (e) {}
        console.log(chalk.green(`\n╭───(    `) + chalk.bold.cyan(`𝐓𝐨𝐱𝐢𝐜-𝐌D`) + chalk.green(`    )───`));
        console.log(chalk.green(`> ───≫ `) + chalk.yellow(`🚀 Started Successfully`) + chalk.green(`<<───`));
        console.log(chalk.green(`> `) + chalk.white(`\`々\` 𝐒𝐭𝐚𝐭𝐮𝐬 : `) + chalk.green(`Started Successfully`));
        console.log(chalk.green(`> `) + chalk.white(`\`々\` 𝐌𝐨𝐝𝐞 : `) + chalk.cyan(`${settingss.mode || 'public'}`));
        console.log(chalk.green(`╰──────────────────☉\n`));
        global._toxicConnectTime = Date.now();

        // Keepalive: send WhatsApp presence every 4 minutes to prevent ghost WS
        if (global._toxicKeepalive) clearInterval(global._toxicKeepalive);
        global._toxicKeepalive = setInterval(() => {
            client.sendPresenceUpdate('available').catch(() => {});
        }, 4 * 60 * 1000);

        // Ghost watchdog: if no message events for 50 minutes, force a reconnect
        if (global._toxicGhost) clearInterval(global._toxicGhost);
        global._toxicGhost = setInterval(() => {
            const lastMsg = global._toxicLastActivity || 0;
            if (Date.now() - lastMsg > 50 * 60 * 1000) {
                console.log('🔄 [WATCHDOG] No activity for 50min — reconnecting...');
                global._toxicLastActivity = Date.now();
                try { client.ws?.close?.(); } catch {}
            }
        }, 15 * 60 * 1000);
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

app.use(express.static('public'));
app.get("/", (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));
app.listen(port, () => console.log(`Server running on port ${port}`));


startBackupInterval(db);
startToxic();

module.exports = { startToxic, invalidateSettingsCache };

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename} — restarting...`));
  process.exit(0);
});
