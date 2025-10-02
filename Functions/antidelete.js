const { loadChatData, saveChatData } = require("../lib/Store");

module.exports = async (client, m, store, pict) => {
    try {
        const { getSettings } = require('../Database/config');
        const settings = await getSettings();

        if (!settings || !settings.antidelete || !m.message || m.key.fromMe) return;

        const botNumber = await client.decodeJid(client.user.id);
        const remoteJid = m.key.remoteJid;
        const messageId = m.key.id;
        const participant = m.key.participant || remoteJid;

        if (participant === botNumber) return;

        // =======================
        // Store incoming messages
        // =======================
        if (!m.message.protocolMessage) {
            saveChatData(remoteJid, messageId, [m]);
            console.log(`📩 Stored message from ${participant} in ${remoteJid}`);
            return;
        }

        // =======================
        // Handle deleted messages
        // =======================
        if (m.message.protocolMessage?.key) {
            const originalMessageId = m.message.protocolMessage.key.id;
            const chatData = loadChatData(remoteJid, originalMessageId);
            const originalMessage = chatData[0];

            if (!originalMessage) {
                console.log(`⚠️ No stored message found for ID ${originalMessageId}`);
                return;
            }

            const deletedBy = participant;
            const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;
            const deletedByFormatted = `@${deletedBy.split('@')[0]}`;
            const sentByFormatted = `@${sentBy.split('@')[0]}`;

            let notificationText =
                `◈━━━━━━━━━━━━━━━━◈\n` +
                `│❒ *DELETED MESSAGE DETECTED* 🥀\n` +
                `│❒ *Deleted by*: ${deletedByFormatted}\n` +
                `│❒ *Sent by*: ${sentByFormatted}\n` +
                `┗━━━━━━━━━━━━━━━┛`;

            try {
                // ========== TEXT ==========
                if (originalMessage.message?.conversation) {
                    const messageText = originalMessage.message.conversation;
                    notificationText += `\n│❒ *Message*: ${messageText}`;
                    await client.sendMessage(botNumber, { text: notificationText });
                    console.log(`✅ Recovered deleted text from ${sentBy}`);
                }

                // ========== EXTENDED TEXT ==========
                else if (originalMessage.message?.extendedTextMessage) {
                    const messageText = originalMessage.message.extendedTextMessage.text;
                    notificationText += `\n│❒ *Message*: ${messageText}`;
                    await client.sendMessage(botNumber, { text: notificationText });
                    console.log(`✅ Recovered deleted extended text from ${sentBy}`);
                }

                // ========== IMAGE ==========
                else if (originalMessage.message?.imageMessage) {
                    notificationText += `\n│❒ *Media*: [Image]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, {
                            image: buffer,
                            caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.imageMessage.caption || 'None'}`,
                        });
                        console.log(`✅ Recovered deleted image from ${sentBy}`);
                    } catch (err) {
                        console.error("❌ Failed to recover image:", err);
                        await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Could not recover image (expired)` });
                    }
                }

                // ========== VIDEO ==========
                else if (originalMessage.message?.videoMessage) {
                    notificationText += `\n│❒ *Media*: [Video]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, {
                            video: buffer,
                            caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.videoMessage.caption || 'None'}`,
                        });
                        console.log(`✅ Recovered deleted video from ${sentBy}`);
                    } catch (err) {
                        console.error("❌ Failed to recover video:", err);
                        await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Could not recover video (expired)` });
                    }
                }

                // ========== STICKER ==========
                else if (originalMessage.message?.stickerMessage) {
                    notificationText += `\n│❒ *Media*: [Sticker]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, { sticker: buffer });
                        console.log(`✅ Recovered deleted sticker from ${sentBy}`);
                    } catch (err) {
                        console.error("❌ Failed to recover sticker:", err);
                        await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Could not recover sticker (expired)` });
                    }
                }

                // ========== DOCUMENT ==========
                else if (originalMessage.message?.documentMessage) {
                    notificationText += `\n│❒ *Media*: [Document]`;
                    try {
                        const docMessage = originalMessage.message.documentMessage;
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        await client.sendMessage(botNumber, {
                            document: buffer,
                            fileName: docMessage.fileName || `document_${Date.now()}.dat`,
                            mimetype: docMessage.mimetype || 'application/octet-stream',
                        });
                        console.log(`✅ Recovered deleted document from ${sentBy}`);
                    } catch (err) {
                        console.error("❌ Failed to recover document:", err);
                        await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Could not recover document (expired)` });
                    }
                }

                // ========== AUDIO ==========
                else if (originalMessage.message?.audioMessage) {
                    notificationText += `\n│❒ *Media*: [Audio]`;
                    try {
                        const buffer = await client.downloadMediaMessage(originalMessage);
                        const isPTT = originalMessage.message.audioMessage.ptt === true;
                        await client.sendMessage(botNumber, { audio: buffer, ptt: isPTT, mimetype: 'audio/mpeg' });
                        console.log(`✅ Recovered deleted audio from ${sentBy}`);
                    } catch (err) {
                        console.error("❌ Failed to recover audio:", err);
                        await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Could not recover audio (expired)` });
                    }
                }

                // ========== UNSUPPORTED ==========
                else {
                    await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Unsupported message type` });
                    console.log(`⚠️ Unsupported deleted message type from ${sentBy}`);
                }

            } catch (err) {
                console.error("❌ Antidelete Handler Error:", err);
                await client.sendMessage(botNumber, { text: `${notificationText}\n│❒ *Error*: Failed to recover deleted content 😓` });
            }
        }

    } catch (err) {
        console.error("❌ Toxic-MD Antidelete Error:", err);
    }
};

// =======================
// Regular cleanup function
// =======================
setInterval(() => {
    const fs = require("fs");
    const path = require("path");
    const baseDir = path.resolve(__dirname, "../message_data");

    try {
        if (!fs.existsSync(baseDir)) return;
        const now = Date.now();

        fs.readdirSync(baseDir).forEach(chatDir => {
            const chatPath = path.join(baseDir, chatDir);
            if (fs.lstatSync(chatPath).isDirectory()) {
                fs.readdirSync(chatPath).forEach(file => {
                    const filePath = path.join(chatPath, file);
                    const stats = fs.statSync(filePath);
                    // delete files older than 24 hours
                    if (now - stats.mtimeMs > 24 * 60 * 60 * 1000) {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Cleaned old stored message: ${filePath}`);
                    }
                });
            }
        });
    } catch (e) {
        console.error("❌ Cleanup Error:", e);
    }
}, 60 * 60 * 1000); // cleanup every 1 hour