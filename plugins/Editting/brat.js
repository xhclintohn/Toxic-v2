const axios = require('axios');

module.exports = {
    name: 'brat',
    aliases: ['bratsticker', 'brattext'],
    description: 'Makes brat stickers for your attention-seeking ass',
    run: async (context) => {
        const { client, m, prefix } = context;

        const text = m.body.replace(new RegExp(`^${prefix}(brat|bratsticker|brattext)\\s*`, 'i'), '').trim();

        if (!text) {
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ BRAT ≪───\n├ \n├ What am i, a mind reader?\n├ @${m.sender.split('@')[0]}! you forgot the text, genius.\n├ Example: ${prefix}brat i'm a dumbass\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const apiUrl = `https://api.nekolabs.web.id/canvas/brat?text=${encodeURIComponent(text)}`;
            
            const response = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.data || response.data.length < 1000) {
                throw new Error('API returned empty image');
            }

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await client.sendMessage(m.chat, {
                image: response.data,
                caption: `╭───(    TOXIC-MD    )───\n├───≫ BRAT TEXT ≪───\n├ \n├ "${text}"\n├ Stop being so needy.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });

        } catch (error) {
            console.error('Brat command error:', error);

            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            let errorMessage = 'your brat text failed. shocking.';

            if (error.message.includes('status')) {
                errorMessage = 'API died from cringe. Try again when your text is less stupid.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Your internet is as weak as your personality.';
            } else if (error.message.includes('empty')) {
                errorMessage = 'API returned empty image. Your text was too cringe even for the API.';
            } else {
                errorMessage = `Even the error is embarrassed: ${error.message}`;
            }

            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Brat text generation failed.\n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }
    }
};