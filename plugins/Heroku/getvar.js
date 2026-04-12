const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const axios = require("axios");
const { herokuAppName, getHerokuApiKey } = require("../../config/settings");
const { getFakeQuoted } = require('../../lib/fakeQuoted');

const SENSITIVE = ['heroku_api_key', 'api_key', 'database_url', 'session', 'secret', 'password', 'token', 'private_key', 'auth', 'key'];

function isSensitive(key) {
    return SENSITIVE.some(s => key.toLowerCase().includes(s));
}

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, prefix } = context;
        const fq = getFakeQuoted(m);
        const herokuApiKey = getHerokuApiKey();

        if (!herokuAppName || !herokuApiKey) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ HEROKU_APP_NAME or HEROKU_API_KEY not set.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        if (!text) {
            return await m.reply(`╭───(    TOXIC-MD    )───\n├ Usage: ${prefix}getvar VAR_NAME\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const varName = text.trim().split(" ")[0];

        if (isSensitive(varName)) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ That variable is protected and cannot be retrieved. 🔒\n├ For your own security.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        if (m.isGroup) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ Use this command in your DM only, not in groups. 🔒\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        try {
            const response = await axios.get(`https://api.heroku.com/apps/${herokuAppName}/config-vars`, {
                headers: { Authorization: `Bearer ${herokuApiKey}`, Accept: "application/vnd.heroku+json; version=3" }
            });
            const varValue = response.data[varName];
            if (varValue !== undefined) {
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ GETVAR ≪───\n├ \n├ ${varName} = ${varValue}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            } else {
                await m.reply(`╭───(    TOXIC-MD    )───\n├ Var "${varName}" doesn't exist.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }
        } catch (error) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Failed to fetch var.\n├ ${error.response?.data || error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
