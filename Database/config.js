const fs = require("fs");
const path = require("path");

const configFile = path.join(__dirname, "settings.json");

// Load settings from file (or default)
function getSettings() {
    try {
        if (fs.existsSync(configFile)) {
            const raw = fs.readFileSync(configFile, "utf8");
            return JSON.parse(raw);
        }
    } catch (err) {
        console.error("Failed to load settings.json:", err);
    }
    // default config
    return {
        antidelete: true,
        // add other default settings here
    };
}

// Save settings to file
function saveSettings(newSettings) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(newSettings, null, 2));
        console.log("✅ [Database] Settings saved to JSON.");
    } catch (err) {
        console.error("❌ [Database] Failed to save settings:", err);
    }
}

module.exports = {
    getSettings,
    saveSettings
};