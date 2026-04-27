import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import fs from 'fs';
import path from 'path';

async function authenticationn() {
    try {
        const sessionDir = path.join(__dirname, '..', 'Session');
        const credsPath = path.join(sessionDir, 'creds.json');
        const sessionFilePath = path.join(__dirname, '..', 'session.json');

        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }

        let sessionData = process.env.SESSION || '';

        if (!sessionData || sessionData === 'zokk') {
            if (fs.existsSync(sessionFilePath)) {
                const fileContent = fs.readFileSync(sessionFilePath, 'utf8').trim();
                if (fileContent && fileContent !== 'zokk') {
                    try {
                        const parsed = JSON.parse(fileContent);
                        const sid = parsed.SESSION_ID || parsed.session || parsed.SESSION || '';
                        if (sid && sid !== 'PASTE_YOUR_SESSION_ID_HERE') {
                            sessionData = sid;
                        }
                    } catch {
                        sessionData = fileContent;
                    }
                    if (sessionData && sessionData !== 'zokk') {
                        console.log('📁 Session loaded from session.json');
                    }
                }
            }
        }

        if (!sessionData || sessionData === 'zokk') {
            console.log('⚠️ No session found in SESSION env or session.json — expecting existing Session/creds.json');
            return;
        }

        const decoded = Buffer.from(sessionData, 'base64').toString('utf8');

        if (!fs.existsSync(credsPath)) {
            console.log('✅ Session saved...');
        }
        fs.writeFileSync(credsPath, decoded, 'utf8');
    } catch (e) {
        console.log('Session is invalid: ' + e);
        return;
    }
}

export default authenticationn;