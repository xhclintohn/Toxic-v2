const fs = require("fs");
const path = require("path");
const moment = require("moment");

const STORE_PATH = path.join(__dirname, "../Database/store.json");

// ✅ Ensure store file exists
function ensureStoreFile() {
    if (!fs.existsSync(STORE_PATH)) {
        fs.writeFileSync(STORE_PATH, JSON.stringify({}), "utf8");
    }
}

// ✅ Load stored messages
function loadStore() {
    ensureStoreFile();
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
}

// ✅ Save store back to file
function saveStore(store) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

// ✅ Main AntiDelete function
async function antidelete(client, m, store, pict) {
    ensureStoreFile();

    const chats = loadStore();

    // 1️⃣ Store incoming messages
    if (!m.messageStubType && !m.key.fromMe && m.message) {
        const messageID = m.key.id;
        const jid = m.chat;
        const sender = m.sender;

        if (!chats[jid]) chats[jid] = {};
        chats[jid][messageID] = {
            sender,
            type: Object.keys(m.message)[0],
            content: m.message,
            timestamp: moment().format("YYYY-MM-DD HH:mm:ss")
        };

        saveStore(chats);
        return; // nothing else to do until a delete event
    }

    // 2️⃣ Detect deleted message
    if (m.messageStubType === 68 && m.messageStubParameters) {
        const jid = m.key.remoteJid;
        const deletedID = m.messageStubParameters[0];

        const storedChat = chats[jid];
        if (!storedChat || !storedChat[deletedID]) return;

        const deletedMsg = storedChat[deletedID];
        const sender = deletedMsg.sender;
        const type = deletedMsg.type;

        // 3️⃣ Restore deleted message
        try {
            await client.sendMessage(jid, {
                text: `💀 *Anti-Delete Detected!*\n\nFrom: @${sender.split("@")[0]}\nType: ${type}`,
                mentions: [sender]
            }, { quoted: { key: { participant: sender, fromMe: false }, message: deletedMsg.content } });
        } catch (err) {
            console.error("Toxic-MD: Error restoring deleted message:", err);
        }
    }
}

module.exports = { antidelete };