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
            caption: `Type: ${type}\n—\nTσxιƈ-ɱԃȥ`
        }, { quoted: m });

    } catch (error) {
        console.error('NSFW error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`Failed to fetch NSFW content.\nError: ${error.message}\nTry again or stop being horny.`);
    }
};