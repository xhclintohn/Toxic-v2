const { proto, generateMessageID } = require("baileys-pro");
const fs = require("fs");
const path = require("path");
const { getSettings } = require("../Database/config");

const baseDir = path.join(__dirname, "..", "message_data");

if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

function loadChatData(remoteJid, messageId) {
    const chatFilePath = path.join(baseDir, remoteJid.replace(/[@.]/g, "_"), `${messageId}.json`);
    try {
        const data = fs.readFileSync(chatFilePath, "utf8");
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

function saveChatData(remoteJid, messageId, chatData) {
    const chatDir = path.join(baseDir, remoteJid.replace(/[@.]/g, "_"));
    if (!fs.existsSync(chatDir)) {
        fs.mkdirSync(chatDir, { recursive: true });
    }
    const chatFilePath = path.join(chatDir, `${messageId}.json`);
    try {
        fs.writeFileSync(chatFilePath, JSON.stringify(chatData, null, 2));
    } catch (error) {
        console.error("Toxic-MD Error saving chat data:", error);
    }
}

async function handleIncomingMessage(client, m) {
    const remoteJid = m.key.remoteJid;
    const messageId = m.key.id;
    const chatData = loadChatData(remoteJid, messageId);
    chatData.push(m);
    saveChatData(remoteJid, messageId, chatData);
}

async function handleMessageRevocation(client, m, pict) {
    const settings = await getSettings();
    if (!settings || !settings.antidelete) return;

    const botNumber = await client.decodeJid(client.user.id);
    const remoteJid = m.key.remoteJid;
    const messageId = m.message.protocolMessage.key.id;

    const chatData = loadChatData(remoteJid, messageId);
    const originalMessage = chatData[0];

    if (!originalMessage) return;

    const deletedBy = m.participant || m.key.participant || m.key.remoteJid;
    const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;

    if (deletedBy.includes(botNumber) || sentBy.includes(botNumber)) return;

    const deletedByFormatted = `@${deletedBy.split("@")[0]}`;
    const sentByFormatted = `@${sentBy.split("@")[0]}`;

    let notificationText = `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ TOXIC-MD ANTIDELETE 🧨\n` +
        `│❒ Caught ${deletedByFormatted} tried to erase evidence! 😈\n` +
        `│❒ Sent by: ${sentByFormatted}\n` +
        `◈━━━━━━━━━━━━━━━━◈\n`;

    try {
        if (originalMessage.message?.conversation) {
            const messageText = originalMessage.message.conversation;
            notificationText += `│❒ Deleted Text: ${messageText}\n`;
            await client.sendMessage(botNumber, { text: notificationText });
        } else if (originalMessage.message?.extendedTextMessage) {
            const messageText = originalMessage.message.extendedTextMessage.text;
            notificationText += `│❒ Deleted Quote: ${messageText}\n`;
            await client.sendMessage(botNumber, { text: notificationText });
        } else if (originalMessage.message?.imageMessage) {
            notificationText += `│❒ Deleted Media: [Image] 📸\n`;
            const buffer = await client.downloadMediaMessage(originalMessage);
            if (buffer) {
                await client.sendMessage(botNumber, {
                    image: buffer,
                    caption: `${notificationText}\nImage caption: ${originalMessage.message.imageMessage.caption || "None"}`,
                    contextInfo: {
                        externalAdReply: {
                            title: "TOXIC-MD ANTIDELETE 🧨",
                            body: `Busted by Toxic-MD!`,
                            thumbnail: pict,
                            sourceUrl: "",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }
        } else if (originalMessage.message?.videoMessage) {
            notificationText += `│❒ Deleted Media: [Video] 🎥\n`;
            const buffer = await client.downloadMediaMessage(originalMessage);
            if (buffer) {
                await client.sendMessage(botNumber, {
                    video: buffer,
                    caption: `${notificationText}\nVideo caption: ${originalMessage.message.videoMessage.caption || "None"}`,
                    contextInfo: {
                        externalAdReply: {
                            title: "TOXIC-MD ANTIDELETE 🧨",
                            body: `Busted by Toxic-MD!`,
                            thumbnail: pict,
                            sourceUrl: "",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }
        } else if (originalMessage.message?.stickerMessage) {
            notificationText += `│❒ Deleted Media: [Sticker] 😎\n`;
            const buffer = await client.downloadMediaMessage(originalMessage);
            if (buffer) {
                await client.sendMessage(botNumber, {
                    sticker: buffer,
                    contextInfo: {
                        externalAdReply: {
                            title: "TOXIC-MD ANTIDELETE 🧨",
                            body: `Deleted by: ${deletedByFormatted}`,
                            thumbnail: pict,
                            sourceUrl: "",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }
        } else if (originalMessage.message?.documentMessage) {
            notificationText += `│❒ Deleted Media: [Document] 📄\n`;
            const docMessage = originalMessage.message.documentMessage;
            const fileName = docMessage.fileName || `document_${Date.now()}.dat`;
            const buffer = await client.downloadMediaMessage(originalMessage);
            if (buffer) {
                await client.sendMessage(botNumber, {
                    document: buffer,
                    fileName: fileName,
                    mimetype: docMessage.mimetype || "application/octet-stream",
                    contextInfo: {
                        externalAdReply: {
                            title: "TOXIC-MD ANTIDELETE 🧨",
                            body: `Deleted by: ${deletedByFormatted}`,
                            thumbnail: pict,
                            sourceUrl: "",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }
        } else if (originalMessage.message?.audioMessage) {
            notificationText += `│❒ Deleted Media: [Audio] 🎙️\n`;
            const buffer = await client.downloadMediaMessage(originalMessage);
            const isPTT = originalMessage.message.audioMessage.ptt === true;
            if (buffer) {
                await client.sendMessage(botNumber, {
                    audio: buffer,
                    ptt: isPTT,
                    mimetype: "audio/mpeg",
                    contextInfo: {
                        externalAdReply: {
                            title: "TOXIC-MD ANTIDELETE 🧨",
                            body: `Deleted by: ${deletedByFormatted}`,
                            thumbnail: pict,
                            sourceUrl: "",
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Toxic-MD Antidelete Error:", error);
    }
}

module.exports = async (client, m, store, pict) => {
    try {
        const settings = await getSettings();
        if (!settings || !settings.antidelete) return;

        if (m.message?.protocolMessage?.key) {
            await handleMessageRevocation(client, m, pict);
        } else {
            await handleIncomingMessage(client, m);
        }
    } catch (e) {
        console.error("Toxic-MD Antidelete Error:", e);
    }
};