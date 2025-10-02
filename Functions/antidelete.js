const { loadChatData, saveChatData, cleanupChatData } = require("../lib/Store");

module.exports = async (client, m, store, pict) => {
    try {
        const settings = await require('../Database/config').getSettings();
        if (!settings || !settings.antidelete || !m.message || m.key.fromMe) {
            return;
        }

        const botNumber = await client.decodeJid(client.user.id);
        const remoteJid = m.key.remoteJid;
        const messageId = m.key.id;
        const participant = m.key.participant || remoteJid;

        // Ignore bot’s own messages to prevent duplicates
        if (participant === botNumber) return;

        // Handle incoming message (store it)
        if (!m.message.protocolMessage) {
            saveChatData(remoteJid, messageId, [m]);
            return;
        }

        // Handle revocation (protocolMessage)
        if (m.message.protocolMessage?.key) {
            const originalMessageId = m.message.protocolMessage.key.id;
            const chatData = loadChatData(remoteJid, originalMessageId);
            const originalMessage = chatData[0];

            if (!originalMessage) return;

            const deletedBy = participant;
            const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;
            const deletedByFormatted = `@${deletedBy.split('@')[0]}`;
            const sentByFormatted = `@${sentBy.split('@')[0]}`;

            let notificationText = `◈━━━━━━━━━━━━━━━━◈
│❒ *DELETED MESSAGE DETECTED* 🥀
│❒ *Deleted by*: ${deletedByFormatted}
│❒ *Sent by*: ${sentByFormatted}
┗━━━━━━━━━━━━━━━┛`;

            try {
                if (originalMessage.message?.conversation) {
                    const messageText = originalMessage.message.conversation;
                    notificationText += `\n│❒ *Message*: ${messageText}`;
                    await client.sendMessage(remoteJid, { text: notificationText, mentions: [deletedBy, sentBy] });

                } else if (originalMessage.message?.extendedTextMessage) {
                    const messageText = originalMessage.message.extendedTextMessage.text;
                    notificationText += `\n│❒ *Message*: ${messageText}`;
                    await client.sendMessage(remoteJid, { text: notificationText, mentions: [deletedBy, sentBy] });

                } else if (originalMessage.message?.imageMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    notificationText += `\n│❒ *Media*: [Image]`;
                    await client.sendMessage(remoteJid, {
                        image: buffer,
                        caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.imageMessage.caption || 'None'}`,
                        mentions: [deletedBy, sentBy],
                        contextInfo: {
                            externalAdReply: {
                                title: "Toxic-MD Antidelete",
                                body: `DELETED BY: ${deletedByFormatted}`,
                                thumbnail: pict,
                                sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });

                } else if (originalMessage.message?.videoMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    notificationText += `\n│❒ *Media*: [Video]`;
                    await client.sendMessage(remoteJid, {
                        video: buffer,
                        caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.videoMessage.caption || 'None'}`,
                        mentions: [deletedBy, sentBy],
                        contextInfo: {
                            externalAdReply: {
                                title: "Toxic-MD Antidelete",
                                body: `DELETED BY: ${deletedByFormatted}`,
                                thumbnail: pict,
                                sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    });

                } else if (originalMessage.message?.stickerMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    notificationText += `\n│❒ *Media*: [Sticker]`;
                    await client.sendMessage(remoteJid, { sticker: buffer });

                } else if (originalMessage.message?.documentMessage) {
                    const docMessage = originalMessage.message.documentMessage;
                    const fileName = docMessage.fileName || `document_${Date.now()}.dat`;
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    notificationText += `\n│❒ *Media*: [Document]`;
                    await client.sendMessage(remoteJid, {
                        document: buffer,
                        fileName: fileName,
                        mimetype: docMessage.mimetype || 'application/octet-stream',
                        caption: notificationText,
                        mentions: [deletedBy, sentBy]
                    });

                } else if (originalMessage.message?.audioMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage);
                    const isPTT = originalMessage.message.audioMessage.ptt === true;
                    notificationText += `\n│❒ *Media*: [Audio]`;
                    await client.sendMessage(remoteJid, {
                        audio: buffer,
                        ptt: isPTT,
                        mimetype: 'audio/mpeg',
                        caption: notificationText,
                        mentions: [deletedBy, sentBy]
                    });

                } else {
                    // Unsupported message
                    notificationText += `\n│❒ *Error*: Unsupported message type`;
                    await client.sendMessage(remoteJid, { text: notificationText, mentions: [deletedBy, sentBy] });
                }
            } catch (error) {
                console.error('Toxic-MD Antidelete Error:', error);
                await client.sendMessage(remoteJid, { text: `${notificationText}\n│❒ *Error*: Failed to recover deleted content 😓`, mentions: [deletedBy, sentBy] });
            }
        }

        // 🧹 Run cleanup every time
        cleanupChatData(24 * 60 * 60 * 1000); // delete older than 24h

    } catch (e) {
        console.error("Toxic-MD Antidelete Error:", e);
    }
};