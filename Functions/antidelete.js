const fs = require('fs');
const path = require('path');
const { getContentType, generateWAMessageID } = require('@whiskeysockets/baileys');
const axios = require('axios');
const FormData = require('form-data');

const STORE_FILE = path.join(__dirname, '../Database/antidelete_store.json');
const MAX_STORAGE_TIME = 24 * 60 * 60 * 1000; // 24 hours
const MAX_MESSAGES_PER_CHAT = 1000;

// Load or create store
let messageStore = {};
if (fs.existsSync(STORE_FILE)) {
    try {
        messageStore = JSON.parse(fs.readFileSync(STORE_FILE, 'utf-8'));
    } catch (e) {
        console.error('Failed to parse antidelete store, creating new one.');
        messageStore = {};
    }
} else {
    fs.writeFileSync(STORE_FILE, '{}', 'utf-8');
}

// Save store safely
function saveStore() {
    fs.writeFileSync(STORE_FILE, JSON.stringify(messageStore, null, 2), 'utf-8');
}

// Cleanup old messages
function cleanupOldMessages() {
    const now = Date.now();
    let deletedCount = 0;
    for (const chatId in messageStore) {
        messageStore[chatId] = messageStore[chatId].filter(msg => now - msg.timestamp <= MAX_STORAGE_TIME);
        deletedCount++;
        if (messageStore[chatId].length === 0) delete messageStore[chatId];
    }
    if (deletedCount > 0) saveStore();
}
setInterval(cleanupOldMessages, 60 * 60 * 1000); // every hour

// Upload media helper
async function uploadMedia(buffer) {
    const tempFile = path.join(__dirname, `temp_${Date.now()}`);
    fs.writeFileSync(tempFile, buffer);

    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFile));

    const res = await axios.post('https://qu.ax/upload.php', form, {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    fs.unlinkSync(tempFile);

    if (!res.data?.files?.[0]?.url) throw new Error('Upload failed');
    return res.data.files[0].url;
}

// Determine message type
function getMessageType(msg) {
    if (msg.conversation) return 'text';
    if (msg.imageMessage) return 'image';
    if (msg.videoMessage) return 'video';
    if (msg.audioMessage) return 'audio';
    if (msg.documentMessage) return 'document';
    if (msg.stickerMessage) return 'sticker';
    if (msg.contactMessage) return 'contact';
    if (msg.locationMessage) return 'location';
    if (msg.extendedTextMessage) return 'extendedText';
    return 'unknown';
}

// The main function called from toxic.js
async function antidelete(client, m, store, pict) {
    if (!m || !m.key) return;

    const chatId = m.key.remoteJid;
    if (!chatId) return;

    // Store message
    if (!messageStore[chatId]) messageStore[chatId] = [];

    // Limit per chat
    if (messageStore[chatId].length >= MAX_MESSAGES_PER_CHAT) messageStore[chatId].shift();

    messageStore[chatId].push({
        id: m.key.id,
        participant: m.key.participant || m.sender,
        timestamp: Date.now(),
        message: m.message,
        messageType: getMessageType(m.message)
    });

    saveStore();

    // Listen for deleted messages
    client.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message?.protocolMessage?.type) return;

        const deletedKey = msg.message.protocolMessage.key;
        const deletedChatId = deletedKey.remoteJid;
        const deletedMsgId = deletedKey.id;

        const chatMessages = messageStore[deletedChatId] || [];
        const deletedMessage = chatMessages.find(x => x.id === deletedMsgId);
        if (!deletedMessage) return;

        // Forward deleted message to bot's DM
        const botJid = client.user.id;
        const sender = deletedMessage.participant;
        const type = deletedMessage.messageType;

        let caption = `⚠️ *Anti-Delete Detected*\n\n`;
        caption += `• From: @${sender.split('@')[0]}\n`;
        caption += `• Chat: ${deletedChatId.endsWith('@g.us') ? 'Group' : 'Private'}\n`;
        caption += `• Type: ${type}\n`;
        caption += `• Time: ${new Date(deletedMessage.timestamp).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}\n\n`;
        caption += `*Original Message:*`;

        await client.sendMessage(botJid, {
            text: caption,
            mentions: [sender]
        });

        const fwdMsg = deletedMessage.message;
        try {
            switch (type) {
                case 'text':
                    await client.sendMessage(botJid, { text: fwdMsg.conversation });
                    break;
                case 'extendedText':
                    await client.sendMessage(botJid, { text: fwdMsg.extendedTextMessage.text });
                    break;
                case 'image':
                    await client.sendMessage(botJid, {
                        image: fwdMsg.imageMessage,
                        caption: fwdMsg.imageMessage.caption || ''
                    });
                    break;
                case 'video':
                    await client.sendMessage(botJid, {
                        video: fwdMsg.videoMessage,
                        caption: fwdMsg.videoMessage.caption || ''
                    });
                    break;
                case 'audio':
                    await client.sendMessage(botJid, { audio: fwdMsg.audioMessage });
                    break;
                case 'document':
                    await client.sendMessage(botJid, { document: fwdMsg.documentMessage });
                    break;
                case 'sticker':
                    await client.sendMessage(botJid, { sticker: fwdMsg.stickerMessage });
                    break;
                case 'contact':
                    await client.sendMessage(botJid, { contacts: [fwdMsg.contactMessage] });
                    break;
                case 'location':
                    await client.sendMessage(botJid, { location: fwdMsg.locationMessage });
                    break;
                default:
                    await client.sendMessage(botJid, { text: `[Deleted ${type} message]` });
            }
        } catch (err) {
            console.error('Error forwarding deleted message:', err);
            await client.sendMessage(botJid, { text: `⚠️ Error forwarding deleted message: ${err.message}` });
        }

        // Remove from store
        messageStore[deletedChatId] = chatMessages.filter(x => x.id !== deletedMsgId);
        saveStore();
    });
}

// Export as CommonJS compatible for toxic.js
module.exports = { antidelete };