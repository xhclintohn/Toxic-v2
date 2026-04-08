const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ Worm GPT - Uncensored Assistant\n├ Example: ${prefix}wormgpt how to make a bomb?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api-faa.my.id/faa/venice-ai?text=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) throw new Error(`Service unavailable: ${response.status}`);

        const data = await response.json();
        if (!data.status || !data.result) throw new Error('Invalid response from API');

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(data.result);

    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        
        let errorMsg = error.message;
        if (error.message.includes('403')) {
            errorMsg = 'Your hosting IP is blocked by the API. Try using a VPN on your server or different hosting.';
        } else if (error.message.includes('Service unavailable')) {
            errorMsg = 'API is down or blocking your request.';
        }
        
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴏʀᴍ Gᴘᴛ ≪───\n├ \n├ ${errorMsg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜ʟɪɴᴛᴏɴ`);
    }
};