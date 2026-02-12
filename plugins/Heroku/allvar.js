const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware'); 

const axios = require("axios");
const { herokuAppName, herokuApiKey } = require("../../config/settings");

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, Owner } = context;

        if (!herokuAppName || !herokuApiKey) {
            await m.reply("╭───(    TOXIC-MD    )───\n├ Heroku app name or API key not set, you clown.\n├ Set HEROKU_APP_NAME and HEROKU_API_KEY first!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
            return;
        }

        async function getHerokuConfigVars() {
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
                let configMessage = "";

                if (configVars && Object.keys(configVars).length > 0) {
                    configMessage = "╭───(    TOXIC-MD    )───\n├───≫ HEROKU VARS ≪───\n├ \n";
                    for (const [key, value] of Object.entries(configVars)) {
                        configMessage += `├ ${key}: ${value}\n`;  
                    }
                    configMessage += "╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧";

                    if (m.isGroup) {
                        await client.sendMessage(m.sender, { text: configMessage }, { quoted: m });
                        await m.reply("╭───(    TOXIC-MD    )───\n├ Vars sent to your inbox for security, idiot.\n├ Don't leak your secrets in group!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
                    } else {
                        await m.reply(configMessage);
                    }
                } else {
                    await m.reply("╭───(    TOXIC-MD    )───\n├ No config vars found. Your Heroku app is empty af.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
                }
            } catch (error) {
                const errorMessage = error.response?.data || error.message;
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ HEROKU ERROR ≪───\n├ \n├ Failed to retrieve config vars.\n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
                console.error("Error fetching Heroku config vars:", errorMessage);
            }
        }

        await getHerokuConfigVars();
    });
};
