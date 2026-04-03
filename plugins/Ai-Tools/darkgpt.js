const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ Worm GPT - Uncensored Assistant\n├ Example: ${prefix}wormgpt how to make a bomb?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api-faa.my.id/faa/venice-ai?text=${encodeURIComponent(text)}`;

        const response = await axios({
            method: 'get',
            url: apiUrl,
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            responseType: 'json'
        });

        if (response.data && response.data.status === true && response.data.result) {
            const answer = response.data.result.trim();

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            const replyText = `╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ ${answer}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`;

            if (answer.length > 4000) {
                await client.sendMessage(m.chat, { text: replyText.substring(0, 4000) });
            } else {
                await m.reply(replyText);
            }
        } else {
            throw new Error('Invalid response from API');
        }

    } catch (error) {
        console.error("Worm GPT error:", error.message);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "Worm GPT API error. Try again later.";

        if (error.code === 'ECONNABORTED') {
            errorMessage = "API timeout. Server is slow.";
        } else if (error.response?.status === 403) {
            errorMessage = "Access denied. Try using a VPN.";
        } else if (error.response?.status === 404) {
            errorMessage = "API endpoint not found.";
        } else if (error.response?.status === 429) {
            errorMessage = "Rate limit. Wait a few seconds.";
        } else if (error.message) {
            errorMessage = error.message;
        }

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }
};