const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require("path");
const util = require("util");
const chalk = require("chalk");
const speed = require("performance-now");
const { smsg, formatp, tanggal, formatDate, getTime, sleep, clockString, fetchJson, getBuffer, jsonformat, generateProfilePicture, parseMention, getRandom, fetchBuffer } = require('../lib/botFunctions.js');
const { exec, spawn, execSync } = require("child_process");
const { TelegraPh, UploadFileUgu } = require("../lib/toUrl");
const uploadtoimgur = require('../lib/Imgur');
const { commands, aliases, totalCommands } = require('../handlers/commandHandler');
const status_saver = require('../features/status_saver');
const gcPresence = require('../features/gcPresence');
const antitaggc = require('../features/antitag');
const antilink = require('../features/antilink');
const chatbotpm = require('../features/chatbotpm');
const { getSettings, getSudoUsers, getBannedUsers, getGroupSettings, updateSetting } = require('../database/config');
const { botname, mycode } = require('../config/settings');
const { cleanupOldMessages } = require('../lib/Store');
const antistatusmention = require('../features/antistatusmention');
const ownerMiddleware = require('../utils/botUtil/Ownermiddleware');

process.setMaxListeners(50);
cleanupOldMessages();

let _toxicPict = Buffer.alloc(0);
try {
    _toxicPict = fs.readFileSync(path.resolve(__dirname, '../toxic.jpg'));
} catch (e) {
    _toxicPict = Buffer.alloc(0);
}
setInterval(() => cleanupOldMessages(), 12 * 60 * 60 * 1000);

let _cachedSettings = null;
let _cachedSettingsTime = 0;
let _cachedSudo = null;
let _cachedSudoTime = 0;
let _cachedBanned = null;
let _cachedBannedTime = 0;
const _groupMetaCache = new Map();
const FAST_CACHE_TTL = 15000;
const GROUP_META_TTL = 120000;

async function fastGetSettings() {
    const now = Date.now();
    if (_cachedSettings && (now - _cachedSettingsTime) < FAST_CACHE_TTL) return _cachedSettings;
    _cachedSettings = await getSettings();
    _cachedSettingsTime = now;
    return _cachedSettings;
}

async function fastGetSudo() {
    const now = Date.now();
    if (_cachedSudo && (now - _cachedSudoTime) < FAST_CACHE_TTL) return _cachedSudo;
    _cachedSudo = await getSudoUsers();
    _cachedSudoTime = now;
    return _cachedSudo;
}

async function fastGetBanned() {
    const now = Date.now();
    if (_cachedBanned && (now - _cachedBannedTime) < FAST_CACHE_TTL) return _cachedBanned;
    _cachedBanned = await getBannedUsers();
    _cachedBannedTime = now;
    return _cachedBanned;
}

async function fastGroupMetadata(client, jid) {
    const now = Date.now();
    const cached = _groupMetaCache.get(jid);
    if (cached && (now - cached.time) < GROUP_META_TTL) return cached.data;
    try {
        const meta = await client.groupMetadata(jid);
        _groupMetaCache.set(jid, { data: meta, time: now });
        if (_groupMetaCache.size > 200) {
            const oldest = _groupMetaCache.keys().next().value;
            _groupMetaCache.delete(oldest);
        }
        return meta;
    } catch (e) {
        return cached?.data || {};
    }
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
    const isStatus = remoteJid === 'status@broadcast';
    const isBroadcast = remoteJid.includes('@broadcast');
    const isNewsletter = remoteJid.includes('@newsletter');
    return !isStatus && !isBroadcast && !isNewsletter;
}

function normalizeJidForStorage(jid) {
    if (!jid) return jid;
    if (jid.includes('@lid')) {
        return jid.split('@')[0] + '@s.whatsapp.net';
    }
    return jid;
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
    if (message.ephemeralMessage?.message) {
        return extractInnerMessage(message.ephemeralMessage.message);
    }
    if (message.viewOnceMessage?.message) return extractInnerMessage(message.viewOnceMessage.message);
    if (message.viewOnceMessageV2?.message) return extractInnerMessage(message.viewOnceMessageV2.message);
    if (message.viewOnceMessageV2Extension?.message) return extractInnerMessage(message.viewOnceMessageV2Extension.message);
    if (message.documentWithCaptionMessage?.message) return message.documentWithCaptionMessage.message;
    return message;
}

module.exports = toxic = async (client, m, chatUpdate, store) => {
    try {
        const rawSudoUsers = await fastGetSudo();
        const rawBannedUsers = await fastGetBanned();
        const sudoUsers = Array.isArray(rawSudoUsers) ? rawSudoUsers : [];
        const bannedUsers = Array.isArray(rawBannedUsers) ? rawBannedUsers : [];
        let settings = await fastGetSettings();

        if (!settings) {
            console.error("Toxic-MD: Settings not found!");
            return;
        }

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
            } catch (e) {
                console.error('❌ [INTERACTIVE PARAMS ERROR]:', e);
            }
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

        if (body) {
            if (multiprefix === 'true' || multiprefix === true) {
                const mp = ALL_PREFIXES.find(p => body.startsWith(p));
                if (mp) {
                    commandName = body.slice(mp.length).trim().split(/\s+/)[0].toLowerCase();
                } else if (!prefix) {
                    commandName = body.trim().split(/\s+/)[0].toLowerCase();
                }
            } else {
                if (prefix && body.startsWith(prefix)) {
                    commandName = body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
                } else if (!prefix && body.startsWith('/')) {
                    commandName = body.slice(1).trim().split(/\s+/)[0].toLowerCase();
                }
            }
        }

        const resolvedCommandName = aliases[commandName] || commandName;
        const cmd = commands[resolvedCommandName];

        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = m.sender == botNumber;
        let text = (q = args.join(" "));
        const arg = budy.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

        try {
            m.isGroup = m.chat?.endsWith("g.us");
            m.metadata = m.isGroup ? await fastGroupMetadata(client, m.chat) : {};
            const participants = m.metadata?.participants || [];

            let userAdminFound = false;
            let botAdminFound = false;

            for (const p of participants) {
                const participantJid = p.jid || p.id;

                if (participantJid === m.sender) {
                    userAdminFound = p.admin !== null;
                }

                if (participantJid === botNumber) {
                    botAdminFound = p.admin !== null;
                }
            }

            m.isAdmin = userAdminFound;
            m.isBotAdmin = botAdminFound;
        } catch (error) {
            console.error('❌ [GROUP METADATA ERROR]:', error);
            m.metadata = {};
            m.isAdmin = false;
            m.isBotAdmin = false;
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
        const DevToxic = sudoUsers;
        const Owner = DevToxic.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);

        const groupMetadata = m.isGroup ? m.metadata : {};
        const participants = m.isGroup && groupMetadata ? groupMetadata.participants || [] : [];
        const isBotAdmin = m.isBotAdmin;
        const isAdmin = m.isAdmin;
        const IsGroup = m.isGroup;

        const fakeQuoted = {
            key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: m.id },
            message: { conversation: "Verified" },
            contextInfo: { mentionedJid: [m.sender], forwardingScore: 999, isForwarded: true }
        };

        const context = {
            client, m, text, Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, participants,
            pushname, body, budy, totalCommands, args, mime, qmsg, msgToxic, botNumber, itsMe,
            packname, generateProfilePicture, groupMetadata, toxicspeed, mycode, fetchJson, exec,
            getRandom, UploadFileUgu, TelegraPh, prefix, cmd, botname, mode, gcpresence, antitag,
            antidelete: antideleteSetting, fetchBuffer, store, uploadtoimgur, chatUpdate,
            getGroupAdmins: () => [], pict, Tag, stealth, multiprefix
        };

        const bannedMessages = [
            "You Have been banned for calling without permission ⚠️!",
            "You Have been banned for calling without permission ⚠️"
        ];

        const trimmedBody = body.trim();

        if ((trimmedBody.startsWith('>') || trimmedBody.startsWith('$')) && Owner) {
            const evalText = trimmedBody.slice(1).trim();
            if (bannedMessages.some(msg => evalText.includes(msg))) {
                return;
            }
            try {
                await ownerMiddleware(context, async () => {
                    if (!evalText) return m.reply("W eval?🟢!");
                    try {
                        let evaled = await eval(evalText);
                        if (typeof evaled !== 'string') evaled = require('util').inspect(evaled);
                        await m.reply(evaled);
                    } catch (err) {
                        await m.reply("Error during eval execution:\n" + String(err));
                    }
                });
                return;
            } catch (e) {
                console.error('❌ [OWNER MIDDLEWARE ERROR]:', e);
                return;
            }
        }

        if (cmd) {
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, {
                    text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Bᴀɴɴᴇᴅ ≪───\n々 You're banned from using\n々 my commands. Get lost.\n╰──────────────────☉`
                }, { quoted: fakeQuoted });
                return;
            }
        }

        if (cmd && mode === 'private' && !itsMe && !Owner && !sudoUsers.includes(m.sender)) return;

        if (store && shouldStoreMessage(m)) {
            const remoteJid = m.chat || m.key?.remoteJid;
            const normalizedJid = normalizeJidForStorage(remoteJid);

            if (normalizedJid) {
                if (!store.chats) store.chats = Object.create(null);
                if (!store.messageMap) store.messageMap = Object.create(null);

                if (!store.chats[normalizedJid]) {
                    store.chats[normalizedJid] = [];
                }

                const messageId = m.key.id;
                let storedMessage = m.message || {};
                const viewOnceWrapper = storedMessage.viewOnceMessage || storedMessage.viewOnceMessageV2 || storedMessage.viewOnceMessageV2Extension;

                if (viewOnceWrapper?.message) {
                    storedMessage = { ...storedMessage, ...viewOnceWrapper.message };
                }

                const messageWithTimestamp = {
                    ...m,
                    message: storedMessage,
                    timestamp: Date.now(),
                    originalRemoteJid: remoteJid,
                    normalizedRemoteJid: normalizedJid
                };

                store.chats[normalizedJid].push(messageWithTimestamp);
                store.messageMap[messageId] = {
                    normalizedJid: normalizedJid,
                    originalJid: remoteJid,
                    timestamp: Date.now()
                };

                if (store.chats[normalizedJid].length > 20) {
                    const removedMsg = store.chats[normalizedJid].shift();
                    if (removedMsg?.key?.id) {
                        delete store.messageMap[removedMsg.key.id];
                    }
                }

                const totalMapped = Object.keys(store.messageMap).length;
                if (totalMapped > 2000) {
                    const chatKeys = Object.keys(store.chats);
                    for (const ck of chatKeys) {
                        if (['key', 'idGetter', 'dict', 'array'].includes(ck)) continue;
                        if (store.chats[ck] && store.chats[ck].length > 10) {
                            const removed = store.chats[ck].splice(0, store.chats[ck].length - 10);
                            for (const rm of removed) {
                                if (rm?.key?.id) delete store.messageMap[rm.key.id];
                            }
                        }
                    }
                }
            }
        }

        if (m.message?.protocolMessage?.type === 0) {
            const currentSettings = await fastGetSettings();
            const isAntideleteEnabled = currentSettings?.antidelete === true;

            if (isAntideleteEnabled && store?.chats && store?.messageMap) {
                const deletedKey = m.message.protocolMessage.key;
                const deletedMessageId = deletedKey.id;
                const deletedRemoteJid = deletedKey.remoteJid;
                const normalizedDeletedJid = normalizeJidForStorage(deletedRemoteJid);
                const isDeletedFromStatus = deletedRemoteJid === 'status@broadcast' || deletedRemoteJid.includes('@broadcast');
                const isDeletedFromNewsletter = deletedRemoteJid.includes('@newsletter');

                if (isDeletedFromStatus || isDeletedFromNewsletter) {
                    return;
                }

                let deletedMessage = null;
                let chatJidToSearch = null;

                if (store.messageMap[deletedMessageId]) {
                    chatJidToSearch = store.messageMap[deletedMessageId].normalizedJid;
                } else {
                    chatJidToSearch = normalizedDeletedJid;
                }

                if (store.chats[chatJidToSearch]) {
                    const chatMessages = store.chats[chatJidToSearch];
                    deletedMessage = chatMessages.find((msg) => msg.key.id === deletedMessageId);
                }

                if (!deletedMessage && normalizedDeletedJid !== chatJidToSearch) {
                    if (store.chats[deletedRemoteJid]) {
                        const chatMessages = store.chats[deletedRemoteJid];
                        deletedMessage = chatMessages.find((msg) => msg.key.id === deletedMessageId);
                    }
                }

                if (!deletedMessage) {
                    for (const [jid, messages] of Object.entries(store.chats)) {
                        if (['key', 'idGetter', 'dict', 'array'].includes(jid)) continue;
                        const foundMsg = messages.find(msg => msg.key.id === deletedMessageId);
                        if (foundMsg) {
                            deletedMessage = foundMsg;
                            chatJidToSearch = jid;
                            break;
                        }
                    }
                }

                if (deletedMessage) {
                    const botJid = client.decodeJid(client.user.id);
                    const sender = client.decodeJid(deletedMessage.key.participant || deletedMessage.key.remoteJid);
                    const deleter = m.key.participant ? m.key.participant.split('@')[0] : 'Unknown';
                    let groupName = 'Private Chat';
