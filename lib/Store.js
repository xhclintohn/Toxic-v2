const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../message_data');

// Create base directory if it doesn't exist
if (!fs.existsSync(baseDir)) {
    try {
        fs.mkdirSync(baseDir, { recursive: true });
        console.log('[Toxic-MD Store] Created base directory:', baseDir);
    } catch (e) {
        console.error('Toxic-MD Store Error: Failed to create /app/message_data directory:', e);
    }
}

function loadChatData(remoteJid, messageId) {
    const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);
    try {
        const data = fs.readFileSync(chatFilePath, 'utf8');
        return JSON.parse(data) || [];
    } catch {
        return [];
    }
}

function saveChatData(remoteJid, messageId, chatData) {
    const chatDir = path.join(baseDir, remoteJid);

    if (!fs.existsSync(chatDir)) {
        try {
            fs.mkdirSync(chatDir, { recursive: true });
            console.log(`[Toxic-MD Store] Created directory for JID: ${remoteJid}`);
        } catch (e) {
            console.error('Toxic-MD Store Error: Failed to create directory:', e);
        }
    }

    const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);

    try {
        fs.writeFileSync(chatFilePath, JSON.stringify({ time: Date.now(), data: chatData }, null, 2));
        console.log(`[Toxic-MD Store] Saved message for ${remoteJid} (${messageId})`);
    } catch (error) {
        console.error('Toxic-MD Store Error: Failed to save chat data:', error);
    }
}

// 🧹 Cleanup old chat files
function cleanupChatData(maxAge = 24 * 60 * 60 * 1000) {
    let removedCount = 0;
    const now = Date.now();

    try {
        const jids = fs.readdirSync(baseDir);
        for (const jid of jids) {
            const jidDir = path.join(baseDir, jid);
            if (!fs.lstatSync(jidDir).isDirectory()) continue;

            const files = fs.readdirSync(jidDir);
            for (const file of files) {
                const filePath = path.join(jidDir, file);

                try {
                    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (now - fileData.time > maxAge) {
                        fs.unlinkSync(filePath);
                        removedCount++;
                    }
                } catch {
                    // if file corrupted, remove it
                    fs.unlinkSync(filePath);
                    removedCount++;
                }
            }

            // Remove directory if empty
            if (fs.readdirSync(jidDir).length === 0) {
                fs.rmdirSync(jidDir);
                console.log(`[Toxic-MD Store] Removed empty directory: ${jidDir}`);
            }
        }

        if (removedCount > 0) {
            console.log(`[Toxic-MD Store] Cleanup done → Removed ${removedCount} old messages`);
        }
    } catch (e) {
        console.error('Toxic-MD Store Error: Cleanup failed:', e);
    }
}

module.exports = { loadChatData, saveChatData, cleanupChatData };