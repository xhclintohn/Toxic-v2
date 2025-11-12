const fs = require('fs');
const path = require('path');
const { proto, generateWAMessageID, getContentType } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');

// Path to store messages
const STORE_PATH = path.join(__dirname, '../Database/antidelete_store.json');

// Ensure the JSON store exists
if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({}));
}

// Load store
let messageStore = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));

// Config
const config = {
    maxStorageTime: 24 * 60 * 60 * 1000, // 24h
    maxMessagesPerChat: 1000
};

// Helper: save store to disk
function saveStore() {
    fs.writeFileSync(STORE_PATH, JSON.stringify(messageStore, null, 2));
}

// Helper: get message type
function getMessageType(message) {
    if (!message) return 'unknown';
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    if (message.contactMessage) return 'contact';
    if (message.locationMessage) return 'location';
    if (message.extendedTextMessage) return 'extendedText';
    return 'unknown';
}

// Cleanup old messages
function cleanupOldMessages() {
    const now = Date.now();
    let deletedCount = 0;

    for (const key in messageStore) {
        const msg = messageStore[key];
        if (now - msg.timestamp > config.maxStorageTime) {
            delete messageStore[key];
            deletedCount++;
        }
    }

    if (deletedCount > 0) saveStore();
}

// Run cleanup every hour
setInterval(cleanupOldMessages, 60 * 60 * 1000);

// Upload media helper (images/videos)
async function uploadMedia(q) {
    const mime = (q.msg || q).mimetype;
    if (!mime) return null;

    const buffer = await q.download();
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}`);
    fs.writeFileSync(tempFilePath, buffer);

    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFilePath));

    const response = await axios.post('https://qu.ax/upload.php', form, {
        headers: { ...form.getHeaders() },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    fs.unlinkSync(tempFilePath);

    if (!response.data?.files?.[0]?.url) throw new Error('No URL returned by API');
    return response.data.files[0].url;
}

// Main antidelete function
async function antidelete(context) {
    const { client, m } = context;
    if (!m || !m.key || !m.key.remoteJid || !m.key.id) return;

    const chatId = m.key.remoteJid;
    const msgId = m.key.id;

    // Store message
    if (!messageStore[chatId]) messageStore[chatId] = {};
    if (Object.keys(messageStore[chatId]).length >= config.maxMessagesPerChat) {
        // Delete oldest message
        const oldest = Object.entries(messageStore[chatId]).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) delete messageStore[chatId][oldest[0]];
    }

    const storedMsg = {
        id: msgId,
        message: m.message,
        participant: m.key.participant || m.key.remoteJid,
        type: chatId.endsWith('@g.us') ? 'group' : 'private',
        timestamp: m.messageTimestamp || Date.now(),
        messageType: getMessageType(m.message)
    };

    // Upload media if it's an image or video
    if (storedMsg.messageType === 'image' || storedMsg.messageType === 'video') {
        try {
            const mediaUrl = await uploadMedia(m.quoted || m);
            storedMsg.mediaUrl = mediaUrl;
        } catch (err) {
            console.error('Media upload error:', err);
        }
    }

    messageStore[chatId][msgId] = storedMsg;
    saveStore();
}

// Setup listeners
function setupAntiDeleteListeners(sock) {
    // Store all messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m?.message) return;
        await antidelete({ client: sock, m });
    });

    // Detect deleted messages
    sock.ev.on('messages.delete', async ({ keys }) => {
        if (!keys || keys.length === 0) return;

        for (const key of keys) {
            const chatId = key.remoteJid;
            const msgId = key.id;
            const deletedMsg = messageStore[chatId]?.[msgId];
            if (!deletedMsg) continue;

            const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const sender = deletedMsg.participant;
            const type = deletedMsg.messageType;

            let caption = `⚠️ *Anti-Delete Detection*\n\n`;
            if (deletedMsg.type === 'group') caption += `• From: @${sender.split('@')[0]}\n• Chat: Group\n`;
            else caption += `• Chat: Private\n`;
            caption += `• Type: ${type}\n• Time: ${new Date(deletedMsg.timestamp).toLocaleString()}\n\n*Original Message:*`;

            try {
                // Send deleted message to bot's DM
                await sock.sendMessage(botJid, { text: caption, mentions: deletedMsg.type === 'group' ? [sender] : [] });

                if (type === 'text') await sock.sendMessage(botJid, { text: deletedMsg.message.conversation });
                else if (type === 'extendedText') await sock.sendMessage(botJid, { text: deletedMsg.message.extendedTextMessage.text });
                else if (type === 'image' || type === 'video') {
                    const url = deletedMsg.mediaUrl;
                    if (url) await sock.sendMessage(botJid, { 
                        image: deletedMsg.message.imageMessage || deletedMsg.message.videoMessage,
                        caption: url
                    });
                } else {
                    await sock.sendMessage(botJid, { text: `[Deleted ${type} message]` });
                }

                delete messageStore[chatId][msgId];
                saveStore();
            } catch (err) {
                console.error('Error resending deleted message:', err);
            }
        }
    });
}

module.exports = { antidelete, setupAntiDeleteListeners };