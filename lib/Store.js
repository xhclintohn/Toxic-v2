const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../message_data');

// Create base directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
    try {
        fs.mkdirSync(baseDir, { recursive: true });
    } catch (e) {
        console.error('Toxic-MD Store Error: Failed to create /app/message_data directory:', e);
    }
}

function loadChatData(remoteJid, messageId) {
    const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);
    try {
        const data = fs.readFileSync(chatFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch (error) {
        return [];
    }
}

function saveChatData(remoteJid, messageId, chatData) {
    const chatDir = path.join(baseDir, remoteJid);

    if (!fs.existsSync(chatDir)) {
        try {
            fs.mkdirSync(chatDir, { recursive: true });
        } catch (e) {
            console.error('Toxic-MD Store Error: Failed to create directory:', e);
        }
    }

    const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);

    try {
        fs.writeFileSync(chatFilePath, JSON.stringify(chatData, null, 2));
    } catch (error) {
        console.error('Toxic-MD Store Error: Failed to save chat data:', error);
    }
}

module.exports = { loadChatData, saveChatData };