const fs = require('fs')
const path = require('path')
const { session } = require('../config/settings')

async function authenticationn() {

    try {

        const sessionDir = path.join(__dirname, '..', 'Session')

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true })
        }

        if (!session || !session.trim()) return

        const decoded = Buffer.from(session, 'base64').toString('utf8')

        const credsPath = path.join(sessionDir, 'creds.json')

        if (!fs.existsSync(credsPath)) {
            fs.writeFileSync(credsPath, decoded)
            console.log("🟢 Session restored")
        }

    } catch (e) {
        console.log("Session invalid:", e)
    }
}

module.exports = authenticationn