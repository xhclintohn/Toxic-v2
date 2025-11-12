const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../store.json');

if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ messages: {}, enabledChats: [] }, null, 2));
}

function loadStore() {
    try {
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch {
        return { messages: {}, enabledChats: [] };
    }
}

function saveStore(data) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

let store = loadStore();

const config = {
    maxStorageTime: 24 * 60 * 60 * 1000, // 24h
    maxMessagesPerChat: 1000,
    debug: false,
};

function logDebug(msg) {
    if (config.debug) console.log(`[AntiDelete Debug] ${msg}`);
}

function getType(message) {
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    if (message.contactMessage) return 'contact';
    if (message.locationMessage) return 'location';
    if (message.extendedTextMessage) return 'extendedText';
    if (message.reactionMessage) return 'reaction';
    return 'unknown';
}

function cleanupOld() {
    const now = Date.now();
    let removed = 0;
    for (const id in store.messages) {
        const msg = store.messages[id];
        if (now - msg.timestamp > config.maxStorageTime) {
            delete store.messages[id];
            removed++;
        }
    }
    if (removed > 0) {
        saveStore(store);
        logDebug(`Cleaned ${removed} expired messages`);
    }
}
setInterval(cleanupOld, 60 * 60 * 1000);

async function execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;

    if (args[0] === 'status') {
        const enabled = store.enabledChats.includes(chatId);
        const total = Object.values(store.messages).filter(m => m.from === chatId).length;
        await sock.sendMessage(chatId, {
            text: `🔍 *AntiDelete Status*\n\n` +
                  `• Enabled: ${enabled ? '✅ Yes' : '❌ No'}\n` +
                  `• Stored messages: ${total}\n` +
                  `• Storage time: 24 hours`
        });
        return;
    }

    if (args[0] === 'clear') {
        const before = Object.keys(store.messages).length;
        for (const id in store.messages) {
            if (store.messages[id].from === chatId) delete store.messages[id];
        }
        saveStore(store);
        await sock.sendMessage(chatId, { text: `🧹 Cleared ${before} stored messages.` });
        return;
    }

    if (args[0] === 'debug') {
        config.debug = !config.debug;
        return sock.sendMessage(chatId, { text: `Debug mode ${config.debug ? 'ON' : 'OFF'}` });
    }

    if (store.enabledChats.includes(chatId)) {
        store.enabledChats = store.enabledChats.filter(id => id !== chatId);
        saveStore(store);
        await sock.sendMessage(chatId, { text: '❌ Anti-delete disabled for this chat.' });
    } else {
        store.enabledChats.push(chatId);
        saveStore(store);
        await sock.sendMessage(chatId, { text: '✅ Anti-delete enabled. Deleted messages will be restored.' });
    }
}

function setupAntiDeleteListeners(sock) {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        const chatId = m.key.remoteJid;
        if (!m.message || !store.enabledChats.includes(chatId)) return;

        const type = getType(m.message);
        store.messages[m.key.id] = {
            id: m.key.id,
            message: m.message,
            from: chatId,
            sender: m.key.participant || chatId,
            timestamp: m.messageTimestamp || Date.now(),
            type
        };

        const msgs = Object.values(store.messages).filter(m => m.from === chatId);
        if (msgs.length > config.maxMessagesPerChat) {
            const oldest = msgs.sort((a, b) => a.timestamp - b.timestamp)[0];
            delete store.messages[oldest.id];
        }

        saveStore(store);
        logDebug(`Stored ${m.key.id} (${type})`);
    });

    sock.ev.on('messages.delete', async (update) => {
        const { keys } = update;
        if (!keys?.length) return;

        for (const key of keys) {
            const msg = store.messages[key.id];
            if (!msg || !store.enabledChats.includes(msg.from)) continue;

            const caption = `⚠️ *Message Deleted!*\n• Type: ${msg.type}\n• Time: ${new Date(msg.timestamp * 1000).toLocaleString()}\n\n*Restored message:*`;

            await sock.sendMessage(msg.from, { text: caption });

            const forward = msg.message;
            try {
                if (msg.type === 'text') {
                    await sock.sendMessage(msg.from, { text: forward.conversation });
                } else if (msg.type === 'extendedText') {
                    await sock.sendMessage(msg.from, { text: forward.extendedTextMessage.text });
                } else if (msg.type === 'image') {
                    await sock.sendMessage(msg.from, { image: forward.imageMessage, caption: forward.imageMessage.caption || '' });
                } else if (msg.type === 'video') {
                    await sock.sendMessage(msg.from, { video: forward.videoMessage, caption: forward.videoMessage.caption || '' });
                } else if (msg.type === 'sticker') {
                    await sock.sendMessage(msg.from, { sticker: forward.stickerMessage });
                } else {
                    await sock.sendMessage(msg.from, { text: '[Unsupported message type]' });
                }
            } catch (err) {
                console.error(`Error reposting deleted message:`, err);
            }

            delete store.messages[key.id];
            saveStore(store);
        }
    });
}

module.exports = { execute, setupAntiDeleteListeners };