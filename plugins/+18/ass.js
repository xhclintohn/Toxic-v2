const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const type = 'ass';

        const apiUrl = `https://api.nekolabs.web.id/random/nsfwhub?type=${type}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) throw new Error(`API failed with status: ${response.status}`);
        
        const imageBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(imageBuffer);

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            image: buffer,
            caption: `╭───(    TOXIC-MD    )───\n├───≫ NSFW ≪───\n├ \n├ Type: ${type}\n├ Here you go, you degenerate.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });

    } catch (error) {
        console.error('NSFW error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to fetch NSFW content.\n├ Error: ${error.message}\n├ Try again or stop being horny.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
