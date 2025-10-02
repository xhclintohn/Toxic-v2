const { loadChatData, saveChatData } = require("../lib/Store");
const fs = require("fs");
const path = require("path");

module.exports = async (client, m, store, pict) => {
    try {
        const settings = await require('../Database/config').getSettings();
        if (!settings || !settings.antidelete || !m.message || m.key.fromMe) return;

        const botNumber = await client.decodeJid(client.user.id);
        const remoteJid = m.key.remoteJid;
        const messageId = m.key.id;
        const participant = m.key.participant || remoteJid;

        // ignore messages from the bot itself
        if (participant === botNumber) return;

        // store incoming messages (non-protocol)
        if (!m.message.protocolMessage) {
            saveChatData(remoteJid, messageId, [m]);
            return;
        }

        // handle revocation
        if (m.message.protocolMessage?.key) {
            const originalMessageId = m.message.protocolMessage.key.id;
            const chatData = loadChatData(remoteJid, originalMessageId);
            // chatData is expected to be an array saved by saveChatData(remoteJid, id, [m])
            const originalMessage = Array.isArray(chatData) ? chatData[0] : (chatData && chatData.data ? chatData.data[0] : chatData);

            if (!originalMessage) return;

            const deletedBy = participant;
            const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;
            const deletedByFormatted = `@${deletedBy.split('@')[0]}`;
            const sentByFormatted = `@${sentBy.split('@')[0]}`;

            const header =
`◈━━━━━━━━━━━━━━━━◈
│❒ *DELETED MESSAGE DETECTED* 🥀
│❒ *Deleted by*: ${deletedByFormatted}
│❒ *Sent by*: ${sentByFormatted}
┗━━━━━━━━━━━━━━━┛`;

            // shared context info (preview)
            const contextInfo = {
                externalAdReply: {
                    title: "Toxic-MD Antidelete",
                    body: `DELETED BY: ${deletedByFormatted}`,
                    thumbnail: pict,
                    sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            };

            try {
                // TEXT (plain)
                if (originalMessage.message?.conversation) {
                    const messageText = originalMessage.message.conversation;
                    await client.sendMessage(remoteJid, {
                        text: `${header}\n│❒ *Message*: ${messageText}`,
                        mentions: [deletedBy, sentBy]
                    });

                // EXTENDED TEXT (quoted/long text)
                } else if (originalMessage.message?.extendedTextMessage) {
                    const messageText = originalMessage.message.extendedTextMessage.text;
                    await client.sendMessage(remoteJid, {
                        text: `${header}\n│❒ *Message*: ${messageText}`,
                        mentions: [deletedBy, sentBy]
                    });

                // IMAGE
                } else if (originalMessage.message?.imageMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    if (!buffer || buffer.length === 0) throw new Error('empty buffer');
                    await client.sendMessage(remoteJid, {
                        image: buffer,
                        caption: `${header}\n│❒ *Caption*: ${originalMessage.message.imageMessage.caption || 'None'}`,
                        mentions: [deletedBy, sentBy],
                        contextInfo
                    });

                // VIDEO
                } else if (originalMessage.message?.videoMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    if (!buffer || buffer.length === 0) throw new Error('empty buffer');
                    await client.sendMessage(remoteJid, {
                        video: buffer,
                        caption: `${header}\n│❒ *Caption*: ${originalMessage.message.videoMessage.caption || 'None'}`,
                        mentions: [deletedBy, sentBy],
                        contextInfo
                    });

                // STICKER
                } else if (originalMessage.message?.stickerMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    if (!buffer || buffer.length === 0) throw new Error('empty buffer');
                    await client.sendMessage(remoteJid, {
                        sticker: buffer,
                        mentions: [deletedBy, sentBy],
                        contextInfo
                    });

                // DOCUMENT
                } else if (originalMessage.message?.documentMessage) {
                    const docMessage = originalMessage.message.documentMessage;
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    if (!buffer || buffer.length === 0) throw new Error('empty buffer');
                    await client.sendMessage(remoteJid, {
                        document: buffer,
                        fileName: docMessage.fileName || `document_${Date.now()}.dat`,
                        mimetype: docMessage.mimetype || 'application/octet-stream',
                        caption: header,
                        mentions: [deletedBy, sentBy],
                        contextInfo
                    });

                // AUDIO / VOICE
                } else if (originalMessage.message?.audioMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    if (!buffer || buffer.length === 0) throw new Error('empty buffer');
                    const isPTT = originalMessage.message.audioMessage?.ptt === true;
                    await client.sendMessage(remoteJid, {
                        audio: buffer,
                        ptt: !!isPTT,
                        mimetype: originalMessage.message.audioMessage?.mimetype || 'audio/mpeg',
                        // some clients ignore caption for audio, but send header as a text fallback:
                        caption: header,
                        mentions: [deletedBy, sentBy],
                        contextInfo
                    });

                // Unsupported / fallback
                } else {
                    await client.sendMessage(remoteJid, {
                        text: `${header}\n│❒ *Error*: Unsupported message type`,
                        mentions: [deletedBy, sentBy]
                    });
                }

                // remove stored file after successful attempt (keeps storage small)
                try {
                    const baseDir = path.resolve(__dirname, '../message_data');
                    const chatFile = path.join(baseDir, remoteJid, `${originalMessageId}.json`);
                    if (fs.existsSync(chatFile)) fs.unlinkSync(chatFile);
                } catch (delErr) {
                    console.error('Toxic-MD Antidelete: Failed to remove stored message file:', delErr);
                }

            } catch (mediaError) {
                console.error('Toxic-MD Antidelete: Failed to recover/send original message:', mediaError);
                // send a single error notification to the original chat
                try {
                    await client.sendMessage(remoteJid, {
                        text: `${header}\n│❒ *Error*: Could not recover deleted content (maybe media expired)`,
                        mentions: [deletedBy, sentBy]
                    });
                } catch (e) {
                    console.error('Toxic-MD Antidelete: Failed sending fallback notification:', e);
                }
            }
        }
    } catch (e) {
        console.error("Toxic-MD Antidelete Error:", e);
    }
};