const axios = require("axios");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

const { HEROKU_API_KEY, HEROKU_APP_NAME } = process.env;

module.exports = async (context) => {
    const { client, m } = context;
    await ownerMiddleware(context, async () => {
        try {
            if (!HEROKU_API_KEY || !HEROKU_APP_NAME) {
                return await m.reply("⚠️ *Heroku credentials missing!* Set HEROKU_API_KEY and HEROKU_APP_NAME in environment variables.");
            }

            const args = m.body?.split(' ') || [];
            const subcommand = args[1]?.toLowerCase();

            if (subcommand === 'now') {
                await m.reply("🚀 *Updating Toxic-v2 now!* Please wait 1-2 minutes for deployment...");

                // Trigger Heroku build from GitHub
                await axios.post(
                    `https://api.heroku.com/apps/${HEROKU_APP_NAME}/builds`,
                    {
                        source_blob: {
                            url: 'https://github.com/xhclintohn/Toxic-v2/tarball/main'
                        }
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${HEROKU_API_KEY}`,
                            Accept: 'application/vnd.heroku+json; version=3',
                            'Content-Type': 'application/json'
                        }
                    }
                );

                return await m.reply("✅ *Redeploy triggered successfully!* Your bot will restart with the latest version.");

            } else {
                // Check for updates
                await m.reply("🔍 *Checking GitHub for updates...*");

                // Get latest commit from GitHub
                const githubRes = await axios.get(
                    'https://api.github.com/repos/xhclintohn/Toxic-v2/commits/main'
                );
                const latestCommit = githubRes.data;
                const latestSha = latestCommit.sha;

                // Get latest Heroku build info
                const herokuRes = await axios.get(
                    `https://api.heroku.com/apps/${HEROKU_APP_NAME}/builds`,
                    {
                        headers: {
                            Authorization: `Bearer ${HEROKU_API_KEY}`,
                            Accept: 'application/vnd.heroku+json; version=3'
                        }
                    }
                );

                const lastBuild = herokuRes.data[0];
                const deployedSha = lastBuild?.source_blob?.url || '';
                const alreadyDeployed = deployedSha.includes(latestSha);

                if (alreadyDeployed) {
                    return await m.reply("✅ *No updates available!* Toxic-v2 is already running the latest version. 🔥");
                }

                // New update available
                return await m.reply(
                    `🆕 *New update available!*\n\n` +
                    `*Commit Message:* ${latestCommit.commit.message}\n` +
                    `*Author:* ${latestCommit.commit.author.name}\n` +
                    `*Date:* ${new Date(latestCommit.commit.author.date).toLocaleString()}\n\n` +
                    `Type *${process.env.PREFIX || '.'}update now* to update your bot! 🔄`
                );
            }

        } catch (error) {
            console.error("Update error:", error);
            const errorMessage = error.response?.data?.message || error.message;
            
            if (errorMessage.includes('API key')) {
                await m.reply("❌ *Invalid Heroku API Key!* Check your HEROKU_API_KEY environment variable.");
            } else if (errorMessage.includes('not found')) {
                await m.reply("❌ *App not found!* Check your HEROKU_APP_NAME environment variable.");
            } else {
                await m.reply(`❌ *Update failed:* ${errorMessage}`);
            }
        }
    });
};