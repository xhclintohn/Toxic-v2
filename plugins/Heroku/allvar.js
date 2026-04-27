import ownerMiddleware from '../../utils/botUtil/Ownermiddleware.js';
import axios from 'axios';
import { herokuAppName, getHerokuApiKey } from '../../config/settings.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

const SENSITIVE = ['heroku_api_key', 'api_key', 'database_url', 'session', 'secret', 'password', 'token', 'private_key', 'auth', 'key'];

function isSensitive(key) {
    const lk = key.toLowerCase();
    return SENSITIVE.some(s => lk.includes(s));
}

export default async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        const herokuApiKey = getHerokuApiKey();

        if (!herokuAppName || !herokuApiKey) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return await m.reply("╭───(    TOXIC-MD    )───\n├ HEROKU_APP_NAME or HEROKU_API_KEY not set.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        try {
            const response = await axios.get(`https://api.heroku.com/apps/${herokuAppName}/config-vars`, {
                headers: { Authorization: `Bearer ${herokuApiKey}`, Accept: "application/vnd.heroku+json; version=3" }
            });

            const configVars = response.data;
            if (!configVars || Object.keys(configVars).length === 0) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
                return await m.reply("╭───(    TOXIC-MD    )───\n├ No config vars found.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
            }

            let msg = "╭───(    TOXIC-MD    )───\n├───≫ HEROKU VARS ≪───\n├ \n";
            for (const [key, value] of Object.entries(configVars)) {
                msg += `├ ${key}: ${isSensitive(key) ? '**REDACTED**' : value}\n`;
            }
            msg += "╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧";

            await client.sendMessage(m.sender, { text: msg }, { quoted: fq });
            await m.reply("╭───(    TOXIC-MD    )───\n├ Vars sent to your DM only. 🔒\n├ Sensitive keys are always redacted.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        } catch (error) {
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Failed to fetch config vars.\n├ ${error.response?.data || error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
