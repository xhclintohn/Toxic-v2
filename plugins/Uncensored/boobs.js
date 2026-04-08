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
                caption: `╭───(    TOXIC-MD    )───\n├───≫ NSFW ≪───\n├ \n├ Here's your boobs, you horny bastard.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });

        } catch (error) {
            console.error('Boobs error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to get boobs. You're so\n├ unlucky even porn hates you.\n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
