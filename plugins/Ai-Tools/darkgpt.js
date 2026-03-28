const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ Worm GPT - Uncensored Assistant\n├ Example: ${prefix}wormgpt how to make a bomb?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api.danzy.web.id/api/ai/venice?message=${encodeURIComponent(text)}&system=`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'curl/8.5.0',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        const data = await response.json();

        if (!data || !data.status || !data.result) {
            throw new Error('API returned empty response');
        }

        const answer = data.result.trim();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ ${answer}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);

    } catch (error) {
        console.error("Worm GPT error:", error.message);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "Worm GPT decided your question was too stupid to answer.";

        if (error.message.includes("timeout")) {
            errorMessage = "API timed out. Too busy fixing your ugly questions.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "Can't reach Worm GPT. Server might be dead.";
        } else if (error.message.includes("403")) {
            errorMessage = "Cloudflare blocked the request. Using curl User-Agent to bypass.";
        }

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }
};