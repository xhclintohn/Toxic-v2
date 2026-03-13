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

        if (!fs.existsSync(credsPath)) {
            console.log("🟢🤖...");
            fs.writeFileSync(credsPath, atob(session), "utf8");
        }
        else if (fs.existsSync(credsPath) && session != "zokk") {
            fs.writeFileSync(credsPath, atob(session), "utf8");
        }
    }
    catch (e) {
        console.log("Session is invalid: " + e);
        return;
    }
}

module.exports = authenticationn;