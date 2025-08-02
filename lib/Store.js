const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../message_data');

// Create base directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
    try {
        fs.mkdirSync(baseDir, { recursive: true });
        console.log('Toxic-MD Store: Created /app/message_data directory');
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
        console.log(`Toxic-MD Store: No data found for remoteJid=${remoteJid}, messageId=${messageId}`);
        return [];
    }
}

function saveChatData(remoteJid, messageId, chatData) {
    const chatDir = path.join(baseDir, remoteJid);

    if (!fs.existsSync(chatDir)) {
        try {
            fs.mkdirSync(chatDir, { recursive: true });
            console.log(`Toxic-MD Store: Created directory ${chatDir}`);
        } catch (e) {
            console.error('Toxic-MD Store Error: Failed to create directory:', e);
        }
    }

    const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);

    try {
        fs.writeFileSync(chatFilePath, JSON.stringify(chatData, null, 2));
        console.log(`Toxic-MD Store: Saved message for remoteJid=${remoteJid}, messageId=${messageId}`);
    } catch (error) {
        console.error('Toxic-MD Store Error: Failed to save chat data:', error);
    }
}

module.exports = { loadChatData, saveChatData };