const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { session } = require('../Env/settings');

async function authenticationn() {
    try {
        const sessionDir = path.join(__dirname, '..', 'Session');
        if (session === "zokk") return;

        const compressed = Buffer.from(session, 'base64');
        const jsonString = zlib.inflateSync(compressed).toString('utf-8');
        const payload = JSON.parse(jsonString);

        if (!payload || payload.v !== 1 || !payload.files) return;

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        for (const [fileName, content] of Object.entries(payload.files)) {
            const filePath = path.join(sessionDir, fileName);
            fs.writeFileSync(filePath, content, 'utf-8');
        }

        console.log("🔐 Session restored from Env.settings");

    } catch (e) {
        console.log("Session restore failed: " + e.message);
    }
}

module.exports = authenticationn;