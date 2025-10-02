const fs = require("fs");
const path = require("path");

const configFile = path.join(__dirname, "settings.json");

// =====================
// Load + Save Helpers
// =====================
function loadConfig() {
    try {
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, "utf8"));
        }
    } catch (err) {
        console.error("[Database] Failed to load settings:", err);
    }
    // default structure
    return {
        antidelete: true,
        sudo: [],
        banned: [],
        groups: {}
    };
}

function saveConfig(data) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
        console.log("✅ [Database] Saved settings.json");
    } catch (err) {
        console.error("❌ [Database] Save failed:", err);
    }
}

// =====================
// General Settings
// =====================
function getSettings() {
    const data = loadConfig();
    console.log("⚙️ [Database] Loaded settings:", data);
    return data;
}

function saveSettings(settings) {
    const data = loadConfig();
    Object.assign(data, settings);
    saveConfig(data);
}

// =====================
// Sudo User Functions
// =====================
function getSudoUsers() {
    const data = loadConfig();
    return data.sudo || [];
}

function addSudoUser(user) {
    const data = loadConfig();
    if (!data.sudo.includes(user)) {
        data.sudo.push(user);
        saveConfig(data);
        console.log(`⚙️ Added sudo user: ${user}`);
    }
    return data.sudo;
}

function removeSudoUser(user) {
    const data = loadConfig();
    data.sudo = (data.sudo || []).filter(u => u !== user);
    saveConfig(data);
    console.log(`⚙️ Removed sudo user: ${user}`);
    return data.sudo;
}

// =====================
// Banned User Functions
// =====================
function getBannedUsers() {
    const data = loadConfig();
    return data.banned || [];
}

function banUser(user) {
    const data = loadConfig();
    if (!data.banned.includes(user)) {
        data.banned.push(user);
        saveConfig(data);
        console.log(`🚫 Banned user: ${user}`);
    }
    return data.banned;
}

function unbanUser(user) {
    const data = loadConfig();
    data.banned = (data.banned || []).filter(u => u !== user);
    saveConfig(data);
    console.log(`✅ Unbanned user: ${user}`);
    return data.banned;
}

// =====================
// Group Settings
// =====================
function getGroupSettings(groupId) {
    const data = loadConfig();
    return data.groups[groupId] || {};
}

function saveGroupSettings(groupId, settings) {
    const data = loadConfig();
    data.groups[groupId] = { ...(data.groups[groupId] || {}), ...settings };
    saveConfig(data);
    console.log(`📌 Saved settings for group: ${groupId}`);
    return data.groups[groupId];
}

module.exports = {
    getSettings,
    saveSettings,
    getSudoUsers,
    addSudoUser,
    removeSudoUser,
    getBannedUsers,
    banUser,
    unbanUser,
    getGroupSettings,
    saveGroupSettings
};