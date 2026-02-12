const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 

const axios = require("axios");
const { herokuAppName, herokuApiKey } = require("../../config/settings");


module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, Owner, prefix } = context;

        if (!herokuAppName || !herokuApiKey) {
            await m.reply("╭───(    TOXIC-MD    )───\n├ Heroku app name or API key not set, you clown.\n├ Set HEROKU_APP_NAME and HEROKU_API_KEY first!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
            return;
        }

        if (!text) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ GETVAR ≪───\n├ \n├ Provide a var name, genius.\n├ Usage: ${prefix}getvar VAR_NAME\n├ Example: ${prefix}getvar MYCODE\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            return;
        }

        const varName = text.split(" ")[0].trim();

        async function getHerokuConfigVar(varName) {
            try {
                const response = await axios.get(
                    `https://api.heroku.com/apps/${herokuAppName}/config-vars`,
                    {
                        headers: {
                            Authorization: `Bearer ${herokuApiKey}`,
                            Accept: "application/vnd.heroku+json; version=3",
                        },
                    }
                );

                const configVars = response.data;
                const varValue = configVars[varName];

                if (varValue) {
                    if (m.isGroup) {
                        await m.reply("╭───(    TOXIC-MD    )───\n├ Use this in inbox you fool!\n├ Don't expose your vars in group chat!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
                    }
                    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ GETVAR ≪───\n├ \n├ ${varName} = ${varValue}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                } else {
                    await m.reply(`╭───(    TOXIC-MD    )───\n├ Var "${varName}" doesn't exist, dumbass.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                }
            } catch (error) {
                const errorMessage = error.response?.data || error.message;
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ HEROKU ERROR ≪───\n├ \n├ Failed to retrieve config var.\n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                console.error("Error fetching config var:", errorMessage);
            }
        }

        if (m.isGroup) {
            await getHerokuConfigVar(varName);
        } else {
            await getHerokuConfigVar(varName);
        }
    });
};
