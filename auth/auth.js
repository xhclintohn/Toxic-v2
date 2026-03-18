const fs = require('fs');
const path = require('path');
const { session } = require('../config/settings');

async function authenticationn() {
    try {
        const sessionDir = path.join(__dirname, '..', 'Session');
        const credsPath = path.join(sessionDir, 'creds.json');

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        const decoded = Buffer.from(session, 'base64').toString('utf8');

        if (!fs.existsSync(credsPath)) {
            console.log("Session Saved✅🧬...");
            fs.writeFileSync(credsPath, decoded, 'utf8');
        }
        else if (session !== "zokk") {
            fs.writeFileSync(credsPath, decoded, 'utf8');
        }
    }
    catch (e) {
        console.log("Session is invalid: " + e);
        return;
    }
}

module.exports = authenticationn;