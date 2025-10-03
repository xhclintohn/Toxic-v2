const fs = require('fs');
const path = require('path');

const dbDir = path.resolve(__dirname, '../json_db');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// JSON files
const files = {
    settings: path.join(dbDir, 'settings.json'),
    group_settings: path.join(dbDir, 'group_settings.json'),
    conversations: path.join(dbDir, 'conversations.json'),
    sudo_users: path.join(dbDir, 'sudo_users.json'),
    banned_users: path.join(dbDir, 'banned_users.json'),
    users: path.join(dbDir, 'users.json')
};

// Ensure files exist
for (const key in files) {
    if (!fs.existsSync(files[key])) {
        fs.writeFileSync(files[key], JSON.stringify({}, null, 2));
    }
}

// Helper functions
function readJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
        return {};
    }
}
function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ============ SETTINGS ============
async function getSettings() {
    return readJSON(files.settings);
}
async function updateSetting(key, value) {
    const data = readJSON(files.settings);
    data[key] = value;
    writeJSON(files.settings, data);
}

// ============ GROUP SETTINGS ============
async function getGroupSettings(jid) {
    const groups = readJSON(files.group_settings);
    return groups[jid] || {};
}
async function updateGroupSetting(jid, key, value) {
    const groups = readJSON(files.group_settings);
    if (!groups[jid]) groups[jid] = {};
    groups[jid][key] = value;
    writeJSON(files.group_settings, groups);
}

// ============ SUDO USERS ============
async function addSudoUser(num) {
    const data = readJSON(files.sudo_users);
    data[num] = true;
    writeJSON(files.sudo_users, data);
}
async function removeSudoUser(num) {
    const data = readJSON(files.sudo_users);
    delete data[num];
    writeJSON(files.sudo_users, data);
}
async function getSudoUsers() {
    return Object.keys(readJSON(files.sudo_users));
}

// ============ BANNED USERS ============
async function banUser(num) {
    const data = readJSON(files.banned_users);
    data[num] = true;
    writeJSON(files.banned_users, data);
}
async function unbanUser(num) {
    const data = readJSON(files.banned_users);
    delete data[num];
    writeJSON(files.banned_users, data);
}
async function getBannedUsers() {
    return Object.keys(readJSON(files.banned_users));
}

// ============ CONVERSATION HISTORY ============
async function saveConversation(num, role, message) {
    const conv = readJSON(files.conversations);
    if (!conv[num]) conv[num] = [];
    conv[num].push({ role, message, timestamp: new Date().toISOString() });
    writeJSON(files.conversations, conv);
}
async function getRecentMessages(num) {
    const conv = readJSON(files.conversations);
    return conv[num] || [];
}
async function deleteUserHistory(num) {
    const conv = readJSON(files.conversations);
    delete conv[num];
    writeJSON(files.conversations, conv);
}

module.exports = {
    getSettings,
    updateSetting,
    getGroupSettings,
    updateGroupSetting,
    addSudoUser,
    removeSudoUser,
    getSudoUsers,
    banUser,
    unbanUser,
    getBannedUsers,
    saveConversation,
    getRecentMessages,
    deleteUserHistory
};