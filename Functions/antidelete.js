const { loadChatData, saveChatData } = require("../lib/Store");

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

        if (participant === botNumber) return;

        // Save all incoming messages
        if (!m.message.protocolMessage) {
            saveChatData(remoteJid, messageId, [m]);
            return;
        }

        // Handle deleted messages
        if (m.message.protocolMessage?.key) {
            const originalMessageId = m.message.protocolMessage.key.id;
            const chatData = loadChatData(remoteJid, originalMessageId);
            const originalMessage = chatData?.[0];
            if (!originalMessage) return;

            const deletedBy = participant;
            const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;
            const deletedByFormatted = `@${deletedBy.split('@')[0]}`;
            const sentByFormatted = `@${sentBy.split('@')[0]}`;

            let notificationText =
                `◈━━━━━━━━━━━━━━━━◈\n` +
                `│❒ *DELETED MESSAGE DETECTED* 🥀\n` +
                `│❒ *Deleted by*: ${deletedByFormatted}\n` +
                `│❒ *Sent by*: ${sentByFormatted}`;

            let sendOptions = {
                mentions: [deletedBy, sentBy],
                contextInfo: {
                    externalAdReply: {
                        title: "Toxic-MD Antidelete",
                        body: `DELETED BY: ${deletedByFormatted}`,
                        thumbnail: pict,
                        sourceUrl: "https://github.com/xhclintohn/Toxic-MD",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            };

            try {
                if (originalMessage.message?.conversation) {
                    await client.sendMessage(remoteJid, { text: `${notificationText}\n│❒ *Message*: ${originalMessage.message.conversation}`, ...sendOptions });
                } else if (originalMessage.message?.extendedTextMessage) {
                    await client.sendMessage(remoteJid, { text: `${notificationText}\n│❒ *Message*: ${originalMessage.message.extendedTextMessage.text}`, ...sendOptions });
                } else if (originalMessage.message?.imageMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage, "buffer");
                    await client.sendMessage(remoteJid, { image: buffer, caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.imageMessage.caption || 'None'}`, ...sendOptions });
                } else if (originalMessage.message?.videoMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage, "buffer");
                    await client.sendMessage(remoteJid, { video: buffer, caption: `${notificationText}\n│❒ *Caption*: ${originalMessage.message.videoMessage.caption || 'None'}`, ...sendOptions });
                } else if (originalMessage.message?.stickerMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage, "buffer");
                    await client.sendMessage(remoteJid, { sticker: buffer, ...sendOptions });
                } else if (originalMessage.message?.documentMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage, "buffer");
                    const docMessage = originalMessage.message.documentMessage;
                    await client.sendMessage(remoteJid, {
                        document: buffer,
                        fileName: docMessage.fileName || `document_${Date.now()}.dat`,
                        mimetype: docMessage.mimetype || "application/octet-stream",
                        caption: notificationText,
                        ...sendOptions
                    });
                } else if (originalMessage.message?.audioMessage) {
                    const buffer = await client.downloadMediaMessage(originalMessage, "buffer");
                    const isPTT = originalMessage.message.audioMessage.ptt === true;
                    await client.sendMessage(remoteJid, { audio: buffer, ptt: isPTT, mimetype: "audio/mpeg", caption: notificationText, ...sendOptions });
                } else {
                    await client.sendMessage(remoteJid, { text: `${notificationText}\n│❒ *Error*: Unsupported message type`, ...sendOptions });
                }
            } catch (err) {
                console.error("❌ Toxic-MD Antidelete failed:", err);
                await client.sendMessage(remoteJid, { text: `${notificationText}\n│❒ *Error*: Could not recover deleted media 😓`, ...sendOptions });
            }
        }
    } catch (e) {
        console.error("❌ Toxic-MD Antidelete Crash:", e);
    }
};