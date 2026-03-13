const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const axios = require('axios');
const { herokuAppName, getHerokuApiKey } = require('../../config/settings');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m } = context;

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SHUTDOWN ≪───\n├ \n├ 💀 Toxic-MD going offline...\n├ Killing the dyno. Don't cry.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        if (herokuAppName && herokuApiKey) {
            try {
                await axios.patch(
                    `https://api.heroku.com/apps/${herokuAppName}/formation/web`,
                    { quantity: 0 },
                    {
                        headers: {
                            Authorization: `Bearer ${herokuApiKey}`,
                            Accept: 'application/vnd.heroku+json; version=3',
                            'Content-Type': 'application/json',
                        },
                    }
                );
            } catch (e) {}
        }

        setTimeout(() => process.exit(0), 2000);
    });
};
