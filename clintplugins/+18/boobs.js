const fetch = require('node-fetch');

module.exports = {
    name: 'boobs',
    aliases: ['tits', 'boobies'],
    description: 'Get some boobs (NSFW)',
    run: async (context) => {
        const { client, m, prefix } = context;
        
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const apiUrl = 'https://omegatech-api.dixonomega.tech/api/Nsfw/sexyimg?category=boobs';
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error(`API failed: ${response.status}`);
            
            const imageBuffer = await response.buffer();
            
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await client.sendMessage(m.chat, {
                image: imageBuffer,
                caption: "Here's your boobs, you horny bastard.\n—\nTσxιƈ-ɱԃȥ"
            }, { quoted: m });

        } catch (error) {
            console.error('Boobs error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`Failed to get boobs. You're so unlucky even porn hates you.\nError: ${error.message}`);
        }
    }
};