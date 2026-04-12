const axios = require("axios");
const { herokuAppName, getHerokuApiKey } = require("../../config/settings");
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const herokuApiKey = getHerokuApiKey();
        const { client, m, text, Owner, prefix } = context;
        const fq = getFakeQuoted(m);

        if (!herokuAppName || !herokuApiKey) {
            await m.reply("╭───(    TOXIC-MD    )───\n├ Heroku app name or API key not set, you clown.\n├ Set HEROKU_APP_NAME and HEROKU_API_KEY first!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
            return;
        }

        if (!text) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SETVAR ≪───\n├ \n├ Provide a var and value, moron.\n├ Format: ${prefix}setvar VAR_NAME=VALUE\n├ Example: ${prefix}setvar MYCODE=254\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            return;
        }

        async function setHerokuConfigVar(varName, value) {
            try {
                const response = await axios.patch(
                    `https://api.heroku.com/apps/${herokuAppName}/config-vars`,
                    {
                        [varName]: value
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${herokuApiKey}`,
                            Accept: "application/vnd.heroku+json; version=3",
                        },
                    }
                );

                if (response.status === 200) {
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SETVAR ≪───\n├ \n├ ${varName} updated to "${value}"\n├ Wait 2min for bot to restart, be patient.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                } else {
                    await m.reply("╭───(    TOXIC-MD    )───\n├ Failed to update the config var. Try again, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
                }
            } catch (error) {
                const errorMessage = error.response?.data || error.message;
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ HEROKU ERROR ≪───\n├ \n├ Failed to set config var.\n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                console.error("Error updating config var:", errorMessage);
            }
        }

        const parts = text.split("=");
        if (parts.length !== 2) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Invalid format, you illiterate fool.\n├ Use: ${prefix}setvar VAR_NAME=VALUE\n├ Example: ${prefix}setvar MYCODE=254\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            return;
        }

        const varName = parts[0].trim();
        const value = parts[1].trim();

        await setHerokuConfigVar(varName, value);
    });
};
