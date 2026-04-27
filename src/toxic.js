import { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType, downloadContentFromMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import path from 'path';
import util from 'util';
import speed from 'performance-now';
import { smsg, formatp, tanggal, formatDate, getTime, sleep, clockString, fetchJson, getBuffer, jsonformat, generateProfilePicture, parseMention, getRandom, fetchBuffer, sendJson } from '../lib/botFunctions.js';
import { exec, spawn, execSync } from 'child_process';
import { TelegraPh, UploadFileUgu } from '../lib/toUrl.js';
import { commands, aliases, totalCommands } from '../handlers/commandHandler.js';
import status_saver from '../features/status_saver.js';
import gcPresence from '../features/gcPresence.js';
import antitaggc from '../features/antitag.js';
import antilink from '../features/antilink.js';
import { getGroupSettings, updateSetting } from '../database/config.js';
import { getFakeQuoted } from '../lib/fakeQuoted.js';
import { getCachedSettings, getCachedSudo, getCachedBanned, getCachedSettingsSync, getCachedSudoSync, getCachedBannedSync } from '../lib/settingsCache.js';
import { botname, mycode } from '../config/settings.js';
import { cleanupOldMessages } from '../lib/Store.js';
import * as msgStore from '../lib/MessageStore.js';
import antistatusmention from '../features/antistatusmention.js';
import autoai from '../features/autoai.js';
import toxicaiFeature from '../features/toxicai.js';
import afkFeature from '../features/afk.js';
import ownerMiddleware from '../utils/botUtil/Ownermiddleware.js';
import { lidMappingCache } from '../handlers/smsg.js';

const DEV_NUMBER = '254114885159';

process.setMaxListeners(50);
cleanupOldMessages();

let _toxicPict = Buffer.alloc(0);
try {
    _toxicPict = fs.readFileSync(path.resolve(__dirname, '../toxic.jpg'));
} catch (e) {
    _toxicPict = Buffer.alloc(0);
}
setInterval(() => cleanupOldMessages(), 12 * 60 * 60 * 1000);

let _cachedBotNumber = '';
let _cachedBotJid = '';
if (!global._toxicGroupMetaCache) global._toxicGroupMetaCache = new Map();
const _groupMetaCache = global._toxicGroupMetaCache;
const _groupMetaInFlight = new Map();
const GROUP_META_TTL = 300000;

async function fastGroupMetadata(client, jid) {
      const now = Date.now();
      const cached = _groupMetaCache.get(jid);
      if (cached && (now - cached.time) < GROUP_META_TTL) return cached.data;
      if (_groupMetaInFlight.has(jid)) return _groupMetaInFlight.get(jid);
      const p = (async () => {
          try {
              const meta = await Promise.race([
                  client.groupMetadata(jid),
                  new Promise((_, rej) => setTimeout(() => rej(new Error('meta_timeout')), 5000))
              ]);
              _groupMetaCache.set(jid, { data: meta, time: Date.now() });
              if (_groupMetaCache.size > 200) {
                  const oldest = _groupMetaCache.keys().next().value;
                  _groupMetaCache.delete(oldest);
              }
              return meta;
          } catch (e) {
              return cached?.data || {};
          } finally {
              _groupMetaInFlight.delete(jid);
          }
      })();
      _groupMetaInFlight.set(jid, p);
      return p;
  }

async function downloadMedia(client, message, type) {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch (e) {
        return await client.downloadMediaMessage(message);
    }
}

function shouldStoreMessage(m) {
    const remoteJid = m.chat || m.key?.remoteJid;
    if (!remoteJid) return false;
    return !remoteJid.includes('@broadcast') && !remoteJid.includes('@newsletter');
}

function resolveLidToPhoneNumber(lidJid) {
    if (!lidJid || !lidJid.endsWith('@lid')) return lidJid;
    try {
        const lidNumber = lidJid.split('@')[0].split(':')[0];
        const mapped = lidMappingCache.get(lidNumber) || (globalThis.lidPhoneCache && globalThis.lidPhoneCache.get(lidNumber));
        if (mapped) return mapped + '@s.whatsapp.net';
        return lidJid;
    } catch (e) {
        return lidJid;
    }
}

function getCleanNumber(jid) {
    if (!jid) return 'Unknown';
    let clean = jid.split('@')[0].split(':')[0];
    clean = clean.replace(/[^\d]/g, '');
    if (clean.length > 12) clean = clean.slice(-12);
    return clean;
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

function getMessageType(message) {
    if (!message) return '❓ Unknown';
    const viewOnce = message.viewOnceMessage || message.viewOnceMessageV2 || message.viewOnceMessageV2Extension;
    if (viewOnce) {
        const inner = viewOnce.message || viewOnce;
        if (inner.imageMessage) return '👁️ View Once Image';
        if (inner.videoMessage) return '👁️ View Once Video';
        if (inner.audioMessage) return '👁️ View Once Audio';
        return '👁️ View Once';
    }
    if (message.imageMessage?.viewOnce) return '👁️ View Once Image';
    if (message.videoMessage?.viewOnce) return '👁️ View Once Video';
    if (message.conversation) return '📝 Text';
    if (message.imageMessage) return '🖼️ Image';
    if (message.videoMessage) return '🎥 Video';
    if (message.audioMessage) return '🔊 Audio';
    if (message.stickerMessage) return '😀 Sticker';
    if (message.documentMessage) return '📄 Document';
    if (message.documentWithCaptionMessage) return '📄 Document';
    if (message.contactMessage) return '👤 Contact';
    if (message.contactsArrayMessage) return '👤 Contacts';
    if (message.locationMessage) return '📍 Location';
    if (message.liveLocationMessage) return '📍 Live Location';
    if (message.pollCreationMessage || message.pollCreationMessageV3) return '📊 Poll';
    if (message.extendedTextMessage?.text) return '📝 Extended Text';
    if (message.buttonsResponseMessage) return '🔘 Button Response';
    if (message.listResponseMessage) return '📋 List Response';
    if (message.templateButtonReplyMessage) return '🎨 Template Button';
    if (message.editedMessage) return '✏️ Edited';
    return '❓ Unknown';
}

function extractInnerMessage(message) {
    if (!message) return message;
    if (message.ephemeralMessage?.message) return extractInnerMessage(message.ephemeralMessage.message);
    if (message.viewOnceMessage?.message) return extractInnerMessage(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2?.message) return extractInnerMessage(message.viewOnceMessageV2.message);
    if (message.viewOnceMessageV2Extension?.message) return extractInnerMessage(message.viewOnceMessageV2Extension.message);
    if (message.documentWithCaptionMessage?.message) return message.documentWithCaptionMessage.message;
    return message;
}

function isViewOnceMessage(rawMessage) {
    if (!rawMessage) return false;
    if (rawMessage.viewOnceMessage || rawMessage.viewOnceMessageV2 || rawMessage.viewOnceMessageV2Extension) return true;
    const inner = extractInnerMessage(rawMessage);
    if (inner?.imageMessage?.viewOnce === true) return true;
    if (inner?.videoMessage?.viewOnce === true) return true;
    return false;
}

function getViewOnceMedia(rawMessage) {
    const voWrapper = rawMessage.viewOnceMessage || rawMessage.viewOnceMessageV2 || rawMessage.viewOnceMessageV2Extension;
    if (voWrapper) {
        const inner = voWrapper.message || voWrapper;
        return { image: inner.imageMessage || null, video: inner.videoMessage || null };
    }
    const inner = extractInnerMessage(rawMessage);
    return {
        image: inner?.imageMessage?.viewOnce ? inner.imageMessage : null,
        video: inner?.videoMessage?.viewOnce ? inner.videoMessage : null
    };
}

export default async (client, m, chatUpdate, store) => {
    if (!_cachedBotJid && client.user?.id) {
        _cachedBotJid = client.decodeJid(client.user.id);
        if (_cachedBotJid && _cachedBotJid.includes(':')) {
            _cachedBotJid = _cachedBotJid.split(':')[0];
        }
    }

    if (m.key?.fromMe === true) {
        m.sender = client.user?.id || client.decodeJid(client.user?.id);
    } else {
        m.sender = m.key?.participantAlt || m.key?.participant || m.key?.remoteJidAlt || m.key?.remoteJid;
    }

    if (m.sender && m.sender.endsWith('@lid')) {
        m.sender = resolveLidToPhoneNumber(m.sender);
    }
    if (m.chat && m.chat.endsWith('@lid')) {
        m.chat = resolveLidToPhoneNumber(m.chat);
    }

    if (shouldStoreMessage(m)) {
        const _sRjid = m.chat || m.key?.remoteJid;
        const _sNjid = _sRjid;
        if (_sNjid && m.key?.id) {
            const msgKeys = Object.keys(m.message || {});
            const isUseless = msgKeys.length === 0 ||
                (msgKeys.length === 1 && (msgKeys[0] === 'protocolMessage' || msgKeys[0] === 'senderKeyDistributionMessage')) ||
                (msgKeys.length === 2 && msgKeys.includes('senderKeyDistributionMessage') && msgKeys.includes('messageContextInfo'));
            if (!isUseless) {
                const _sMid = m.key.id;
                const _sSender = m.sender || m.key.participant || m.key.remoteJid || '';
                const _sPayload = { key: m.key, message: m.message || {}, pushName: m.pushName || '' };
                await msgStore.saveMessage(_sMid, _sNjid, _sSender, _sPayload).catch(() => {});
            }
        }
    }

    if (store && shouldStoreMessage(m)) {
        const _s2Rjid = m.chat || m.key?.remoteJid;
        const _s2Njid = _s2Rjid;
        if (_s2Njid) {
            if (!store.chats) store.chats = Object.create(null);
            if (!store.messageMap) store.messageMap = Object.create(null);
            if (!store.chats[_s2Njid]) store.chats[_s2Njid] = [];
            const _s2Mid = m.key.id;
            store.chats[_s2Njid].push({ ...m, message: m.message || {}, timestamp: Date.now(), originalRemoteJid: _s2Rjid, normalizedRemoteJid: _s2Njid });
            store.messageMap[_s2Mid] = { normalizedJid: _s2Njid, originalJid: _s2Rjid, timestamp: Date.now() };
            if (store.chats[_s2Njid].length > 20) {
                const _rmMsg = store.chats[_s2Njid].shift();
                if (_rmMsg?.key?.id) delete store.messageMap[_rmMsg.key.id];
            }
        }
    }

    if (m.key?.fromMe) {
        const _allPfx = ['.','!','#','/','$','?','+','-','*','\~','@','%','&','^','=','|'];
        let _fmBody = (m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
        if (!_fmBody && m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
            try { _fmBody = JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson)?.id || ''; } catch {}
        }
        if (!_fmBody && m.message?.buttonsResponseMessage?.selectedButtonId) {
            _fmBody = m.message.buttonsResponseMessage.selectedButtonId;
        }
        if (!_fmBody && m.message?.templateButtonReplyMessage?.selectedId) {
            _fmBody = m.message.templateButtonReplyMessage.selectedId;
        }
        if (!_fmBody || !_allPfx.some(p => _fmBody.startsWith(p))) return;
    }

    try {
        const rawSudoUsers = getCachedSudoSync();
        const rawBannedUsers = getCachedBannedSync();
        const fetchedSettings = getCachedSettingsSync();
        getCachedSettings().catch(() => {});
        const sudoUsers = Array.isArray(rawSudoUsers) ? rawSudoUsers : [];
        const bannedUsers = Array.isArray(rawBannedUsers) ? rawBannedUsers : [];
        let settings = fetchedSettings;

        if (!settings) { try { settings = await getCachedSettings(); } catch {} if (!settings) return; }

        const { prefix, mode, gcpresence, antitag, antidelete: antideleteSetting, antilink: antilinkSetting, chatbotpm: chatbotpmSetting, packname, multiprefix, stealth } = settings;

        var body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            m.message?.documentMessage?.caption ||
            m.message?.buttonsResponseMessage?.selectedButtonId ||
            m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            m.message?.templateButtonReplyMessage?.selectedId ||
            m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
            m.text ||
            "";

        body = typeof body === 'string' ? body : '';

        if (m.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
            try {
                const params = JSON.parse(m.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
                body = params.id || body;
            } catch (e) {}
        }

        if (m.message?.templateButtonReplyMessage?.selectedId) {
            body = m.message.templateButtonReplyMessage.selectedId;
        }

        const Tag = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        var msgToxic = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
        var budy = typeof m.text == "string" ? m.text : "";

        const timestamp = speed();
        const toxicspeed = speed() - timestamp;
        const pict = _toxicPict;

        const ALL_PREFIXES = ['.','!','#','/','$','?','+','-','*','\~','@','%','&','^','=','|'];
        let commandName = null;
        let usedPrefix = prefix;

        if (body) {
            if (multiprefix === 'true' || multiprefix === true) {
                const mp = ALL_PREFIXES.find(p => body.startsWith(p));
                if (mp) {
                    const _r1 = body.slice(mp.length).trim().split(/\s+/)[0].toLowerCase();
                    commandName = _r1.replace(/^[^\w+]+/, '') || _r1;
                    usedPrefix = mp;
                } else if (!prefix) {
                    commandName = body.trim().split(/\s+/)[0].toLowerCase();
                }
            } else {
                if (prefix && body.startsWith(prefix)) {
                    const _r2 = body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
                    commandName = _r2.replace(/^[^\w+]+/, '') || _r2;
                    usedPrefix = prefix;
                } else if (body.startsWith('/') && prefix !== '/') {
                    const _r3 = body.slice(1).trim().split(/\s+/)[0].toLowerCase();
                    commandName = _r3.replace(/^[^\w+]+/, '') || _r3;
                    usedPrefix = '/';
                } else if (!prefix) {
                    commandName = body.trim().split(/\s+/)[0].toLowerCase();
                }
            }
        }

        const resolvedCommandName = aliases[commandName] || commandName;
        const cmd = commands[resolvedCommandName];
        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        if (!_cachedBotNumber && client?.user?.id) {
            _cachedBotNumber = client.decodeJid(client.user.id);
            if (_cachedBotNumber && _cachedBotNumber.includes(':')) {
                _cachedBotNumber = _cachedBotNumber.split(':')[0];
            }
        }
        let botNumber = _cachedBotNumber || client.decodeJid(client.user.id);
        if (botNumber && botNumber.includes(':')) {
            botNumber = botNumber.split(':')[0];
        }

        const senderNormalized = normalizeNumber(m.sender);
        const botNormalized = normalizeNumber(botNumber);
        const itsMe = senderNormalized === botNormalized;
        let isDev = isDevNumber(m.sender);
        const isSudo = sudoUsers.some(s => normalizeNumber(String(s)) === senderNormalized);
        const Owner = itsMe || isDev || isSudo;
        let text = args.join(" ");
        const arg = budy.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

        m.isGroup = m.chat?.endsWith("g.us");
        m.metadata = {};

        let isAdmin = false;
        let isBotAdmin = false;

        if (m.isGroup) {
            try {
                const cached = _groupMetaCache.get(m.chat);
                if (cached && (Date.now() - cached.time) < GROUP_META_TTL) {
                    m.metadata = cached.data;
                } else {
                    m.metadata = await fastGroupMetadata(client, m.chat);
                    _groupMetaCache.set(m.chat, { data: m.metadata, time: Date.now() });
                }
            } catch (e) {
                m.metadata = {};
            }

            const participants = m.metadata?.participants || [];
            const _lidNumFn = (jid) => (!jid ? '' : jid.split('@')[0].split(':')[0].replace(/\D/g, ''));
            const _resolveNum = (jid) => {
                if (!jid) return '';
                if (jid.endsWith('@lid')) {
                    const lidNum = _lidNumFn(jid);
                    const fromCache = globalThis.lidPhoneCache && globalThis.lidPhoneCache.get(lidNum);
                    if (fromCache) return String(fromCache).replace(/\D/g, '');
                    if (m.metadata) {
                        const ownerLid = _lidNumFn(m.metadata.owner || '');
                        if (ownerLid && ownerLid === lidNum && m.metadata.ownerPn) return m.metadata.ownerPn.split('@')[0].replace(/\D/g, '');
                        const subjectLid = _lidNumFn(m.metadata.subjectOwner || '');
                        if (subjectLid && subjectLid === lidNum && m.metadata.subjectOwnerPn) return m.metadata.subjectOwnerPn.split('@')[0].replace(/\D/g, '');
                    }
                    return lidNum;
                }
                return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
            };
            const _numMatch = (a, b) => {
                if (!a || !b) return false;
                if (a === b) return true;
                const s = a.length < b.length ? a : b;
                const l = a.length < b.length ? b : a;
                return l.endsWith(s) && s.length >= 7;
            };
            const senderNum = _resolveNum(m.sender);
            const botNumP = _resolveNum(botNumber);
            for (const p of participants) {
                const pJid = p.id || p.jid || '';
                const pLid = p.lid || '';
                const pPhone = p.phoneNumber || p.phone_number || p.pn || '';
                const pPn = pPhone ? String(pPhone).replace(/\D/g, '') : '';
                const pNum = pPn || _resolveNum(pJid) || _resolveNum(pLid);
                const isAdminRole = p.admin === 'admin' || p.admin === 'superadmin';
                if (isAdminRole && _numMatch(pNum, senderNum)) isAdmin = true;
                if (isAdminRole && _numMatch(pNum, botNumP)) isBotAdmin = true;
            }
            if (!isBotAdmin && m.isGroup && participants.length > 0) {
                try {
                    const freshMeta = await client.groupMetadata(m.chat);
                    const freshParticipants = freshMeta?.participants || [];
                    for (const p of freshParticipants) {
                        const pJid = p.id || p.jid || '';
                        const pLid = p.lid || '';
                        const pPhone = p.phoneNumber || p.phone_number || p.pn || '';
                        const pPn = pPhone ? String(pPhone).replace(/\D/g, '') : '';
                        const pNum = pPn || _resolveNum(pJid) || _resolveNum(pLid);
                        const isAdminRole = p.admin === 'admin' || p.admin === 'superadmin';
                        if (isAdminRole && _numMatch(pNum, botNumP)) { isBotAdmin = true; break; }
                    }
                } catch {}
            }
            if (Owner) isAdmin = true;
        }

        if (cmd) {
            try {
                const participants = m.metadata?.participants || [];
                const groupMetadata = m.metadata || null;
                const isGroup = m.isGroup || false;
                if (m.mentionedJid && m.mentionedJid.length > 0 && globalThis.resolvePhoneFromLidAsync) {
                    const resolved = [];
                    for (const jid of m.mentionedJid) {
                        if (jid && jid.endsWith('@lid')) {
                            let phone = null;
                            for (const p of participants) {
                                const pBase = p.id || p.jid || '';
                                const pLidField = p.lid || '';
                                const lidNum = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
                                const pLidNum = pBase.endsWith('@lid') ? pBase.split('@')[0].split(':')[0].replace(/\D/g, '') : (pLidField.endsWith('@lid') ? pLidField.split('@')[0].split(':')[0].replace(/\D/g, '') : '');
                                if (pLidNum && pLidNum === lidNum) {
                                    const pPhone = p.phoneNumber || p.phone_number || p.pn || '';
                                    if (pPhone) { phone = String(pPhone).split('@')[0].replace(/\D/g, ''); break; }
                                    if (!pBase.endsWith('@lid')) { phone = pBase.split('@')[0].replace(/\D/g, ''); break; }
                                }
                            }
                            if (!phone) {
                                const asyncResult = await globalThis.resolvePhoneFromLidAsync(jid).catch(() => null);
                                if (asyncResult && typeof asyncResult === 'string') {
                                    phone = asyncResult.split('@')[0].replace(/\D/g, '');
                                }
                            }
                            resolved.push(phone ? phone + '@s.whatsapp.net' : jid);
                        } else {
                            resolved.push(jid);
                        }
                    }
                    m.mentionedJid = resolved;
                }
                const cmdCtx = { client, m, args, text, prefix: usedPrefix, command: commandName, pushname, botNumber, itsMe, isDev, isSudo, Owner, settings, Tag, msgToxic, budy, sock: client, store, isAdmin, isBotAdmin, mode, pict, botname, totalCommands, isGroup, participants, groupMetadata };
                if (typeof cmd.run === 'function') {
                    await cmd.run(cmdCtx);
                } else if (typeof cmd === 'function') {
                    await cmd(cmdCtx);
                }
            } catch (cmdErr) {
                console.log('Command error:', cmdErr.message);
            }
        }

    } catch (e) {
        console.log('toxic.js main error:', e.message);
    }
};