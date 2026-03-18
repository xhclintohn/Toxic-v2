const fs = require('fs');
const path = require('path');
const { session } = require('../config/settings');

async function authenticationn() {
    try {
        const sessionDir = path.join(__dirname, '..', 'Session');

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        if (!session || typeof session !== 'string' || !session.trim()) {
            return;
        }

        const decoded = Buffer.from(session, 'base64').toString('utf8');
        let parsed;

        try {
            parsed = JSON.parse(decoded);
        } catch {
            parsed = null;
        }

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            for (const [fileName, base64Data] of Object.entries(parsed)) {
                if (typeof fileName !== 'string' || typeof base64Data !== 'string') continue;
                const filePath = path.join(sessionDir, fileName);
                fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
            }
            console.log("🟢 Multi-file session restored");
            return;
        }

        const credsPath = path.join(sessionDir, 'creds.json');

        if (!fs.existsSync(credsPath)) {
            fs.writeFileSync(credsPath, decoded, 'utf8');
            console.log("🟢 Single-file session restored");
        } else if (session !== "zokk") {
            fs.writeFileSync(credsPath, decoded, 'utf8');
            console.log("🟢 Single-file session updated");
        }
    } catch (e) {
        console.log("Session is invalid: " + e);
        return;
    }
}

module.exports = authenticationn;