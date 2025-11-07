const axios = require("axios");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

const { HEROKU_API_KEY, HEROKU_APP_NAME } = process.env;

module.exports = async (context) => {
    const { client, m, prefix } = context;

    // Helper for consistent Spotify-style reply format
    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
    };

    await ownerMiddleware(context, async () => {
        try {
            if (!HEROKU_API_KEY || !HEROKU_APP_NAME) {
                return await client.sendMessage(m.chat, {
                    text: formatStylishReply("⚠️ Heroku credentials missing!\nSet *HEROKU_API_KEY* and *HEROKU_APP_NAME* in environment variables."),
                }, { quoted: m });
            }

            const args = m.body?.split(' ') || [];
            const subcommand = args[1]?.toLowerCase();

            if (subcommand === 'now') {
                await client.sendMessage(m.chat, {
                    text: formatStylishReply("🚀 Updating *Toxic-MD* now!\nPlease wait 1–2 minutes for deployment..."),
                }, { quoted: m });

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

                return await client.sendMessage(m.chat, {
                    text: formatStylishReply("✅ Redeploy triggered successfully!\nYour bot will restart with the latest version."),
                }, { quoted: m });

            } else {
                // Check for updates
                await client.sendMessage(m.chat, {
                    text: formatStylishReply("🔍 Checking GitHub for updates..."),
                }, { quoted: m });

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
                    return await client.sendMessage(m.chat, {
                        text: formatStylishReply("✅ No updates available!\n*Toxic-MD* is already running the latest version. 🔥"),
                    }, { quoted: m });
                }

                // New update available
                return await client.sendMessage(m.chat, {
                    text: formatStylishReply(
                        `🆕 New update available!\n\n` +
                        `*Commit Message:* ${latestCommit.commit.message}\n` +
                        `*Author:* ${latestCommit.commit.author.name}\n` +
                        `*Date:* ${new Date(latestCommit.commit.author.date).toLocaleString()}\n\n` +
                        `Type *${prefix}update now* to update your bot! 🔄`
                    ),
                }, { quoted: m });
            }

        } catch (error) {
            console.error("Update error:", error);
            const errorMessage = error.response?.data?.message || error.message;

            let msg;
            if (errorMessage.includes('API key')) {
                msg = "❌ Invalid Heroku API Key!\nCheck your *HEROKU_API_KEY* environment variable.";
            } else if (errorMessage.includes('not found')) {
                msg = "❌ App not found!\nCheck your *HEROKU_APP_NAME* environment variable.";
            } else {
                msg = `❌ Update failed:\n${errorMessage}`;
            }

            await client.sendMessage(m.chat, {
                text: formatStylishReply(msg),
            }, { quoted: m });
        }
    });
};