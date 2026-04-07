const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ Worm GPT - Uncensored Assistant\n├ Example: ${prefix}wormgpt how to make a bomb?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const response = await axios({
            method: 'get',
            url: `https://api-faa.my.id/faa/venice-ai?text=${encodeURIComponent(text)}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://api-faa.my.id/',
                'Origin': 'https://api-faa.my.id'
            }
        });

        if (response.data && response.data.result) {
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await m.reply(response.data.result);
        } else {
            throw new Error('No response from API');
        }

    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        
        let errorMsg = error.message;
        if (error.response?.status === 403) {
            errorMsg = 'API blocked. Try using a different network or VPN on your host.';
        }
        
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ ${errorMsg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }
};