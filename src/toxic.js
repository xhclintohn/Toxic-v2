const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
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

process.setMaxListeners(0);
cleanupOldMessages();
setInterval(() => cleanupOldMessages(), 12 * 60 * 60 * 1000);

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
        const sudoUsers = await getSudoUsers();
        const bannedUsers = await getBannedUsers();
        let settings = await getSettings();
        if (!settings) {
            console.error("Toxic-MD: Settings not found, cannot proceed!");
            return;
        }

        const { prefix, mode, gcpresence, antitag, antidelete: antideleteSetting, antilink: antilinkSetting, chatbotpm: chatbotpmSetting, packname } = settings;

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
        const filePath = require('path').resolve(__dirname, '../toxic.jpg');
        const pict = fs.readFileSync(filePath);

        const commandName = body && (body.startsWith(prefix) || body.startsWith('/'))
            ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase()
            : null;
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
            m.metadata = m.isGroup ? await client.groupMetadata(m.chat).catch(e => ({})) : {};
            const participants = m.metadata?.participants || [];
            
            const extractPhone = (jid) => {
                if (!jid) return '';
                const numbers = jid.replace(/\D/g, '');
                return numbers.slice(-9);
            };
            
            const senderPhone = extractPhone(m.sender);
            const botPhone = extractPhone(botNumber);
            
            let userAdminFound = false;
            let botAdminFound = false;
            
            for (const p of participants) {
                const participantId = p.id || p.jid || '';
                const participantPhone = extractPhone(participantId);
                
                if (!userAdminFound && participantPhone === senderPhone && p.admin !== null) {
                    userAdminFound = true;
                }
                
                if (!botAdminFound && participantPhone === botPhone && p.admin !== null) {
                    botAdminFound = true;
                }
                
                if (userAdminFound && botAdminFound) break;
            }
            
            m.isAdmin = userAdminFound;
            m.isBotAdmin = botAdminFound;
            
        } catch (error) {
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
        const DevToxic = Array.isArray(sudoUsers) ? sudoUsers : [];
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
            getGroupAdmins: () => [], pict, Tag
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
            } catch (e) {}
        }

        if (cmd) {
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, {
                    text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Bᴀɴɴᴇᴅ ≪───\n々 You're banned from using\n々 my commands. Get lost.\n╭───( ✓ )───`
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
            const currentSettings = await getSettings();
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
                    if (chatJidToSearch.endsWith('@g.us')) {
                        try {
                            const gMeta = await client.groupMetadata(chatJidToSearch);
                            groupName = gMeta?.subject || 'Unknown Group';
                        } catch (e) {
                            groupName = 'Unknown Group';
                        }
                    }
                    const deleteTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
                    const messageType = getMessageType(deletedMessage.message);
                    try {
                        const notification = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Dᴇʟᴇᴛᴇᴅ Msɢ ≪───\n々 Time: ${deleteTime}\n々 Chat: ${groupName}\n々 Type: ${messageType}\n々 Deleted by: @${deleter}\n々 Sender: @${sender.split('@')[0]}\n╭───( ✓ )───`;
                        const msg = extractInnerMessage(deletedMessage.message);
                        if (msg.conversation) {
                            await client.sendMessage(botJid, {
                                text: `${notification}\n\n${msg.conversation}`,
                                mentions: [sender]
                            });
                        }
                        else if (msg.extendedTextMessage?.text) {
                            await client.sendMessage(botJid, {
                                text: `${notification}\n\n${msg.extendedTextMessage.text}`,
                                mentions: [sender]
                            });
                        }
                        else if (msg.imageMessage) {
                            const caption = msg.imageMessage.caption || '';
                            const buf = await client.downloadMediaMessage(msg.imageMessage);
                            await client.sendMessage(botJid, {
                                image: buf,
                                caption: `${notification}\n${caption}`,
                                mentions: [sender]
                            });
                        }
                        else if (msg.videoMessage) {
                            const caption = msg.videoMessage.caption || '';
                            const buf = await client.downloadMediaMessage(msg.videoMessage);
                            await client.sendMessage(botJid, {
                                video: buf,
                                caption: `${notification}\n${caption}`,
                                mentions: [sender]
                            });
                        }
                        else if (msg.audioMessage) {
                            const buf = await client.downloadMediaMessage(msg.audioMessage);
                            await client.sendMessage(botJid, { text: notification, mentions: [sender] });
                            await client.sendMessage(botJid, {
                                audio: buf,
                                ptt: msg.audioMessage.ptt || false,
                                mimetype: 'audio/mpeg'
                            });
                        }
                        else if (msg.stickerMessage) {
                            const buf = await client.downloadMediaMessage(msg.stickerMessage);
                            await client.sendMessage(botJid, { text: notification, mentions: [sender] });
                            await client.sendMessage(botJid, { sticker: buf });
                        }
                        else if (msg.documentMessage) {
                            const buf = await client.downloadMediaMessage(msg.documentMessage);
                            await client.sendMessage(botJid, {
                                document: buf,
                                mimetype: msg.documentMessage.mimetype || 'application/octet-stream',
                                fileName: msg.documentMessage.fileName || 'document',
                                caption: `${notification}\n${msg.documentMessage.caption || ''}`,
                                mentions: [sender]
                            });
                        }
                        else if (msg.contactMessage) {
                            const vcard = msg.contactMessage.vcard;
                            const displayName = msg.contactMessage.displayName || 'Contact';
                            await client.sendMessage(botJid, { text: `${notification}\n\n${displayName}`, mentions: [sender] });
                            await client.sendMessage(botJid, {
                                contacts: { displayName, contacts: [{ vcard }] }
                            });
                        }
                        else if (msg.contactsArrayMessage) {
                            const contacts = msg.contactsArrayMessage.contacts || [];
                            const displayName = msg.contactsArrayMessage.displayName || 'Contacts';
                            await client.sendMessage(botJid, { text: `${notification}\n\n${displayName} (${contacts.length} contacts)`, mentions: [sender] });
                            for (const c of contacts) {
                                await client.sendMessage(botJid, {
                                    contacts: { displayName: c.displayName, contacts: [{ vcard: c.vcard }] }
                                });
                            }
                        }
                        else if (msg.locationMessage) {
                            await client.sendMessage(botJid, { text: notification, mentions: [sender] });
                            await client.sendMessage(botJid, {
                                location: {
                                    degreesLatitude: msg.locationMessage.degreesLatitude,
                                    degreesLongitude: msg.locationMessage.degreesLongitude,
                                    name: msg.locationMessage.name || '',
                                    address: msg.locationMessage.address || ''
                                }
                            });
                        }
                        else if (msg.liveLocationMessage) {
                            await client.sendMessage(botJid, {
                                text: `${notification}\n\nLat: ${msg.liveLocationMessage.degreesLatitude}\nLng: ${msg.liveLocationMessage.degreesLongitude}`,
                                mentions: [sender]
                            });
                        }
                        else if (msg.pollCreationMessage || msg.pollCreationMessageV3) {
                            const poll = msg.pollCreationMessage || msg.pollCreationMessageV3;
                            const pollName = poll.name || 'Poll';
                            const options = (poll.options || []).map(o => o.optionName).join('\n々 ');
                            await client.sendMessage(botJid, {
                                text: `${notification}\n\nPoll: ${pollName}\n々 ${options}`,
                                mentions: [sender]
                            });
                        }
                        else {
                            await client.sendMessage(botJid, {
                                text: `${notification}\n\nMessage type could not be recovered`,
                                mentions: [sender]
                            });
                        }
                    } catch (error) {}
                }
            }
        }

        if (m.message?.protocolMessage?.type === 14 || m.message?.editedMessage) {
            const currentSettings = await getSettings();
            const isAntieditEnabled = currentSettings?.antiedit === true;
            if (isAntieditEnabled && store?.chats && store?.messageMap) {
                try {
                    const editedProto = m.message.protocolMessage || {};
                    const editKey = editedProto.key || m.message.editedMessage?.message?.protocolMessage?.key;
                    const newMessage = editedProto.editedMessage?.message || m.message.editedMessage?.message;
                    if (editKey && newMessage) {
                        const editedMessageId = editKey.id;
                        const editedRemoteJid = editKey.remoteJid || m.chat;
                        const normalizedEditJid = normalizeJidForStorage(editedRemoteJid);
                        if (editedRemoteJid !== 'status@broadcast' && !editedRemoteJid.includes('@broadcast') && !editedRemoteJid.includes('@newsletter')) {
                            let originalMessage = null;
                            let chatJid = null;
                            if (store.messageMap[editedMessageId]) {
                                chatJid = store.messageMap[editedMessageId].normalizedJid;
                            } else {
                                chatJid = normalizedEditJid;
                            }
                            if (store.chats[chatJid]) {
                                originalMessage = store.chats[chatJid].find(msg => msg.key.id === editedMessageId);
                            }
                            if (!originalMessage) {
                                for (const [jid, messages] of Object.entries(store.chats)) {
                                    if (['key', 'idGetter', 'dict', 'array'].includes(jid)) continue;
                                    const found = messages.find(msg => msg.key.id === editedMessageId);
                                    if (found) { originalMessage = found; break; }
                                }
                            }
                            const botJid = client.decodeJid(client.user.id);
                            const editor = m.key.participant ? m.key.participant.split('@')[0] : m.sender?.split('@')[0] || 'Unknown';
                            let groupName = 'Private Chat';
                            if (editedRemoteJid.endsWith('@g.us')) {
                                try {
                                    const gMeta = await client.groupMetadata(editedRemoteJid);
                                    groupName = gMeta?.subject || 'Unknown Group';
                                } catch (e) { groupName = 'Unknown Group'; }
                            }
                            const editTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
                            let originalText = '';
                            if (originalMessage?.message) {
                                const origMsg = extractInnerMessage(originalMessage.message);
                                originalText = origMsg.conversation || origMsg.extendedTextMessage?.text || origMsg.imageMessage?.caption || origMsg.videoMessage?.caption || '';
                            }
                            const newInner = extractInnerMessage(newMessage);
                            const newText = newInner.conversation || newInner.extendedTextMessage?.text || newInner.imageMessage?.caption || newInner.videoMessage?.caption || '';
                            if (originalText || newText) {
                                const notification = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Eᴅɪᴛᴇᴅ Msɢ ≪───\n々 Time: ${editTime}\n々 Chat: ${groupName}\n々 Edited by: @${editor}\n╭───( ✓ )───`;
                                let fullMsg = notification;
                                if (originalText) fullMsg += `\n\nOriginal:\n${originalText}`;
                                if (newText) fullMsg += `\n\nEdited to:\n${newText}`;
                                await client.sendMessage(botJid, {
                                    text: fullMsg,
                                    mentions: [m.key.participant || m.sender]
                                });
                            }
                        }
                    }
                } catch (error) {}
            }
        }

        await antilink(client, m, store);
        await chatbotpm(client, m, store, chatbotpmSetting);
        await status_saver(client, m, Owner, prefix);
        await gcPresence(client, m);
        await antitaggc(client, m, isBotAdmin, itsMe, isAdmin, Owner, body);

        const exemptGroup = "120363156185607326@g.us";
        if (m.chat !== exemptGroup) {
            await antistatusmention(client, m);
        }

        if (cmd) {
            await commands[resolvedCommandName](context);
        }

    } catch (err) {
        console.error('❌ [TOXIC] Error:', err.message);
    }
};

process.on('uncaughtException', function (err) {
    let e = String(err);
    if (e.includes("conflict")) return;
    if (e.includes("not-authorized")) return;
    if (e.includes("Socket connection timeout")) return;
    if (e.includes("rate-overlimit")) return;
    if (e.includes("Connection Closed")) return;
    if (e.includes("Timed Out")) return;
    if (e.includes("Value not found")) return;
});