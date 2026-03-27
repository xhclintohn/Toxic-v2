const axios = require('axios');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');

module.exports = async (context) => {
    const { client, m, prefix, packname, author } = context;

    const text = m.body.replace(new RegExp(`^${prefix}(brat|bratsticker|brattext)\\s*`, 'i'), '').trim();

    if (!text) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply('╭───(    TOXIC-MD    )───\n├───≫ BRAT ≪───\n├ \n├ What am i, a mind reader?\n├ @' + m.sender.split('@')[0] + '! you forgot the text, genius.\n├ Example: ' + prefix + 'brat i\'m a dumbass\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧', { mentions: [m.sender] });
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const cleanText = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        const getRandomColor = () => Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
        let bgColor = getRandomColor();
        let textColor = getRandomColor();
        if (bgColor === textColor) {
            textColor = (parseInt(bgColor, 16) ^ 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
        }
        const width = 800;
        const height = Math.max(500, cleanText.split('\n').length * 150);
        const fullText = cleanText;
        const imageUrl = `https://placehold.co/${width}x${height}/${bgColor}/${textColor}/png?text=${encodeURIComponent(fullText)}`;
        
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!imageResponse.data || imageResponse.data.length < 1000) {
            throw new Error('API returned empty image');
        }

        const tempFile = path.join(__dirname, `temp-brat-${Date.now()}.png`);
        await fs.writeFile(tempFile, imageResponse.data);

        const sticker = new Sticker(tempFile, {
            pack: packname || 'p',
            author: author || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 [dev]',
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: '12345',
            quality: 50,
            background: 'transparent'
        });

        const stickerBuffer = await sticker.toBuffer();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await client.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });

        await fs.unlink(tempFile).catch(() => {});

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

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Brat text generation failed.\n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};