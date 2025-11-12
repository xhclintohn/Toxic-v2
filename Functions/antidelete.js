const fs = require('fs');
const path = require('path');
const { proto } = require('@whiskeysockets/baileys');

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
    for (const chatId in messageStore) {
        messageStore[chatId] = messageStore[chatId].filter(msg => now - msg.timestamp <= MAX_STORAGE_TIME);
        if (messageStore[chatId].length === 0) delete messageStore[chatId];
    }
    saveStore();
}
setInterval(cleanupOldMessages, 60 * 60 * 1000); // every hour

// Determine message type
function getMessageType(msg) {
    if (!msg) return 'unknown';
    if (msg.conversation) return 'text';
    if (msg.extendedTextMessage) return 'extendedText';
    if (msg.imageMessage) return 'image';
    if (msg.videoMessage) return 'video';
    if (msg.audioMessage) return 'audio';
    if (msg.documentMessage) return 'document';
    if (msg.stickerMessage) return 'sticker';
    if (msg.contactMessage) return 'contact';
    if (msg.locationMessage) return 'location';
    return 'unknown';
}

// Main antidelete function
async function antidelete(client, m, store) {
    if (!m?.key) return;

    const chatId = m.key.remoteJid;
    if (!chatId) return;

    // Initialize chat in store
    if (!messageStore[chatId]) messageStore[chatId] = [];

    // Limit per chat
    if (messageStore[chatId].length >= MAX_MESSAGES_PER_CHAT) messageStore[chatId].shift();

    messageStore[chatId].push({
        id: m.key.id,
        participant: m.key.participant || m.sender,
        timestamp: Date.now(),
        message: m.message,
        messageType: getMessageType(m.message),
        from: chatId
    });

    saveStore();

    // Listen for deletions
    client.ev.on('messages.delete', async (update) => {
        const { keys } = update;
        if (!keys || keys.length === 0) return;

        for (const key of keys) {
            const deletedMsg = messageStore[key.remoteJid]?.find(msg => msg.id === key.id);
            if (!deletedMsg) continue;

            // Send deleted message to bot's DM
            const botJid = client.user.id;

            let caption = `⚠️ *Anti-Delete Detected*\n\n`;
            caption += `• From: @${deletedMsg.participant.split('@')[0]}\n`;
            caption += `• Chat: ${key.remoteJid.endsWith('@g.us') ? 'Group' : 'Private'}\n`;
            caption += `• Type: ${deletedMsg.messageType}\n`;
            caption += `• Time: ${new Date(deletedMsg.timestamp).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })}\n\n`;
            caption += `*Original Message:*`;

            try {
                await client.sendMessage(botJid, {
                    text: caption,
                    mentions: [deletedMsg.participant]
                });

                const msg = deletedMsg.message;
                switch (deletedMsg.messageType) {
                    case 'text':
                        await client.sendMessage(botJid, { text: msg.conversation });
                        break;
                    case 'extendedText':
                        await client.sendMessage(botJid, { text: msg.extendedTextMessage.text });
                        break;
                    case 'image':
                        await client.sendMessage(botJid, { image: msg.imageMessage, caption: msg.imageMessage.caption || '' });
                        break;
                    case 'video':
                        await client.sendMessage(botJid, { video: msg.videoMessage, caption: msg.videoMessage.caption || '' });
                        break;
                    case 'audio':
                        await client.sendMessage(botJid, { audio: msg.audioMessage });
                        break;
                    case 'document':
                        await client.sendMessage(botJid, { document: msg.documentMessage });
                        break;
                    case 'sticker':
                        await client.sendMessage(botJid, { sticker: msg.stickerMessage });
                        break;
                    case 'contact':
                        await client.sendMessage(botJid, { contacts: [msg.contactMessage] });
                        break;
                    case 'location':
                        await client.sendMessage(botJid, { location: msg.locationMessage });
                        break;
                    default:
                        await client.sendMessage(botJid, { text: `[Deleted ${deletedMsg.messageType} message]` });
                }

            } catch (err) {
                console.error('Error forwarding deleted message:', err);
            }

            // Remove from store
            messageStore[key.remoteJid] = messageStore[key.remoteJid].filter(x => x.id !== key.id);
            saveStore();
        }
    });
}

module.exports = { antidelete, cleanupOldMessages };