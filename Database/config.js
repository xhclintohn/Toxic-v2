const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

// Helper: read JSON safely
function readJSON(file, fallback = {}) {
    try {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) return fallback;
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    } catch (e) {
        console.error(`❌ Error reading ${file}:`, e);
        return fallback;
    }
}

// Helper: write JSON safely
function writeJSON(file, data) {
    try {
        const filePath = path.join(dataDir, file);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`❌ Error writing ${file}:`, e);
    }
}

// ---------- SETTINGS ----------
async function getSettings() {
    return readJSON("settings.json", {
        prefix: ".",
        packname: "Toxic-MD",
        mode: "private",
        presence: "online",
        autoview: false,
        autolike: false,
        autoread: false,
        autobio: false,
        anticall: false,
        chatbotpm: false,
        autolikeemoji: "❤️",
        antilink: false,
        antidelete: false
    });
}

async function updateSetting(key, value) {
    const settings = await getSettings();
    settings[key] = value;
    writeJSON("settings.json", settings);
}

// ---------- GROUP SETTINGS ----------
async function getGroupSettings(jid) {
    const groups = readJSON("group_settings.json", {});
    return groups[jid] || {
        antidelete: true,
        gcpresence: false,
        events: false,
        antidemote: false,
        antipromote: false
    };
}

async function updateGroupSetting(jid, key, value) {
    const groups = readJSON("group_settings.json", {});
    if (!groups[jid]) {
        groups[jid] = {
            antidelete: true,
            gcpresence: false,
            events: false,
            antidemote: false,
            antipromote: false
        };
    }
    groups[jid][key] = value;
    writeJSON("group_settings.json", groups);
}

// ---------- USER MANAGEMENT ----------
async function banUser(num) {
    const banned = readJSON("banned_users.json", []);
    if (!banned.includes(num)) {
        banned.push(num);
        writeJSON("banned_users.json", banned);
    }
}

async function unbanUser(num) {
    let banned = readJSON("banned_users.json", []);
    banned = banned.filter(u => u !== num);
    writeJSON("banned_users.json", banned);
}

async function getBannedUsers() {
    return readJSON("banned_users.json", []);
}

// ---------- SUDO USERS ----------
async function addSudoUser(num) {
    const sudo = readJSON("sudo_users.json", []);
    if (!sudo.includes(num)) {
        sudo.push(num);
        writeJSON("sudo_users.json", sudo);
    }
}

async function removeSudoUser(num) {
    let sudo = readJSON("sudo_users.json", []);
    sudo = sudo.filter(u => u !== num);
    writeJSON("sudo_users.json", sudo);
}

async function getSudoUsers() {
    return readJSON("sudo_users.json", []);
}

// ---------- CONVERSATION HISTORY ----------
async function saveConversation(num, role, message) {
    const history = readJSON("conversation_history.json", {});
    if (!history[num]) history[num] = [];
    history[num].push({ role, message, timestamp: new Date().toISOString() });
    writeJSON("conversation_history.json", history);
}

async function getRecentMessages(num) {
    const history = readJSON("conversation_history.json", {});
    return history[num] || [];
}

async function deleteUserHistory(num) {
    const history = readJSON("conversation_history.json", {});
    delete history[num];
    writeJSON("conversation_history.json", history);
}

// Export
module.exports = {
    getSettings,
    updateSetting,
    getGroupSettings,
    updateGroupSetting,
    banUser,
    unbanUser,
    getBannedUsers,
    addSudoUser,
    removeSudoUser,
    getSudoUsers,
    saveConversation,
    getRecentMessages,
    deleteUserHistory
};