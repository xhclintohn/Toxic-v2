const fs = require("fs");
const path = require("path");

const configFile = path.join(__dirname, "settings.json");

// Load JSON
function loadConfig() {
    try {
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, "utf8"));
        }
    } catch (err) {
        console.error("[Database] Failed to load settings:", err);
    }
    return { antidelete: true, sudo: [] }; // defaults
}

// Save JSON
function saveConfig(data) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(data, null, 2));
        console.log("✅ [Database] Settings saved.");
    } catch (err) {
        console.error("❌ [Database] Save failed:", err);
    }
}

// =====================
// Settings Functions
// =====================
function getSettings() {
    return loadConfig();
}

function saveSettings(settings) {
    saveConfig(settings);
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

module.exports = {
    getSettings,
    saveSettings,
    getSudoUsers,
    addSudoUser,
    removeSudoUser
};