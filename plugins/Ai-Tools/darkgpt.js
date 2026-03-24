const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ Worm GPT - Uncensored Assistant\n├ Example: ${prefix}wormgpt how to make a bomb?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api.danzy.web.id/api/ai/venice?message=${encodeURIComponent(text)}&system=${encodeURIComponent('Reply with a toxic tone always')}`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Referer': 'https://api.danzy.web.id/',
                'Origin': 'https://api.danzy.web.id',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 30000
        });

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('API returned empty response. Worm GPT is probably ignoring you.');
        }

        const answer = response.data.result.trim();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ ${answer}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);

    } catch (error) {
        console.error("Worm GPT error:", error.response?.status, error.message);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "Worm GPT decided your question was too stupid to answer.";

        if (error.response?.status === 403) {
            errorMessage = "Cloudflare blocked the request. API is protected by anti-bot.";
        } else if (error.response?.status === 404) {
            errorMessage = "Worm GPT API vanished. Probably went for coffee.";
        } else if (error.response?.status === 429) {
            errorMessage = "Rate limit exceeded. Even AI needs a break from your dumb questions.";
        } else if (error.message.includes("timeout")) {
            errorMessage = "API timed out. Too busy fixing your ugly questions.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "Can't reach Worm GPT. Server might be dead.";
        }

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }
};