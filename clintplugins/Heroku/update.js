const axios = require("axios");
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

const { HEROKU_API_KEY, HEROKU_APP_NAME } = process.env;

module.exports = async (context) => {
    const { client, m, prefix } = context;

    // Global toxic message formatter
    const formatStylishReply = (message) => {
        return (
            `◈━━━━━━━━━━━━━━━━◈\n` +
            `│❒ ${message}\n` +
            `◈━━━━━━━━━━━━━━━━◈\n` +
            `> Pσɯҽɾҽԃ Ⴆყ Tσxιƈ-ɱԃ 😈`
        );
    };

    await ownerMiddleware(context, async () => {
        try {
            // Missing Heroku vars
            if (!HEROKU_API_KEY || !HEROKU_APP_NAME) {
                return await client.sendMessage(
                    m.chat,
                    {
                        text: formatStylishReply(
                            "⚠️ Seriously? You forgot to set *HEROKU_API_KEY* or *HEROKU_APP_NAME*.\n" +
                            "Fix your setup before crying for updates. 🙄"
                        ),
                    },
                    { quoted: m }
                );
            }

            const args = m.body?.split(" ") || [];
            const subcommand = args[1]?.toLowerCase();

            // FORCE UPDATE NOW
            if (subcommand === "now") {
                await client.sendMessage(
                    m.chat,
                    {
                        text: formatStylishReply(
                            "🔄 Fine… triggering update.\n" +
                            "Don’t complain if the bot restarts in your face. 😒"
                        ),
                    },
                    { quoted: m }
                );

                // Create new Heroku build
                await axios.post(
                    `https://api.heroku.com/apps/${HEROKU_APP_NAME}/builds`,
                    {
                        source_blob: {
                            url: "https://github.com/xhclintohn/Toxic-v2/tarball/main",
                        },
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${HEROKU_API_KEY}`,
                            Accept: "application/vnd.heroku+json; version=3",
                            "Content-Type": "application/json",
                        },
                    }
                );

                return await client.sendMessage(
                    m.chat,
                    {
                        text: formatStylishReply(
                            "🚀 Update triggered.\n" +
                            "Sit tight while Toxic-MD resurrects with fresh upgrades. 💀"
                        ),
                    },
                    { quoted: m }
                );
            }

            // CHECK FOR AVAILABLE UPDATES
            await client.sendMessage(
                m.chat,
                { text: formatStylishReply("🔍 Checking for updates… Try not to blink. 😑") },
                { quoted: m }
            );

            const githubRes = await axios.get(
                "https://api.github.com/repos/xhclintohn/Toxic-v2/commits/main"
            );

            const latestCommit = githubRes.data;
            const latestSha = latestCommit.sha;

            // Fetch Heroku builds
            const herokuRes = await axios.get(
                `https://api.heroku.com/apps/${HEROKU_APP_NAME}/builds`,
                {
                    headers: {
                        Authorization: `Bearer ${HEROKU_API_KEY}`,
                        Accept: "application/vnd.heroku+json; version=3",
                    },
                }
            );

            const lastBuild = herokuRes.data[0];
            const deployedSha = lastBuild?.source_blob?.url || "";
            const alreadyDeployed = deployedSha.includes(latestSha);

            if (alreadyDeployed) {
                return await client.sendMessage(
                    m.chat,
                    {
                        text: formatStylishReply(
                            "😒 Really? You're already on the latest version.\n" +
                            "Stop smashing update commands like a caveman."
                        ),
                    },
                    { quoted: m }
                );
            }

            // Update available!
            await client.sendMessage(
                m.chat,
                {
                    text: formatStylishReply(
                        `🆕 *Update Found!* Calm your excitement.\n\n` +
                        `📌 *Commit:* ${latestCommit.commit.message}\n` +
                        `👤 *Author:* ${latestCommit.commit.author.name}\n` +
                        `🕒 *Date:* ${new Date(
                            latestCommit.commit.author.date
                        ).toLocaleString()}\n\n` +
                        `Type *${prefix}update now* if you want me to do all the work. 🙄`
                    ),
                },
                { quoted: m }
            );
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;

            let msg;

            if (errorMessage.includes("API key")) {
                msg =
                    "❌ Your Heroku API key is trash.\n" +
                    "Fix *HEROKU_API_KEY* before crying here.";
            } else if (errorMessage.includes("not found")) {
                msg =
                    "❌ Heroku app not found.\n" +
                    "Are you sure *HEROKU_APP_NAME* is correct, genius?";
            } else {
                msg = `❌ Update failed:\n${errorMessage}\nTry again without panicking.`;
            }

            await client.sendMessage(
                m.chat,
                { text: formatStylishReply(msg) },
                { quoted: m }
            );
        }
    });
};