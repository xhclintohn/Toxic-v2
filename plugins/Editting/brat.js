const fetch = require('node-fetch');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

module.exports = {
    name: 'brat',
    aliases: ['bratsticker', 'brattext'],
    description: 'Makes brat stickers for your attention-seeking ass',
    run: async (context) => {
        const { client, m, prefix } = context;

        const text = m.body.replace(new RegExp(`^${prefix}(brat|bratsticker|brattext)\\s*`, 'i'), '').trim();

        if (!text) {
            return client.sendMessage(m.chat, {
                text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 what am i, a mind reader? @${m.sender.split('@')[0]}! you forgot the text, genius. 🤦🏻\n々 example: ${prefix}brat i'm a dumbass\n╭───( ✓ )───`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const apiUrl = `https://api.nekolabs.web.id/canvas/brat?text=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`api says you're not worth the response: ${response.status}`);
            }

            const imageBuffer = await response.buffer();

            if (!imageBuffer || imageBuffer.length < 1000) {
                throw new Error('api returned empty image');
            }

            const sticker = new Sticker(imageBuffer, {
                pack: 'your bratty demands',
                author: 'toxic-md',
                type: StickerTypes.FULL,
                categories: ['😤', '🤡'],
                quality: 50,
                background: 'transparent'
            });

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            const stickerBuffer = await sticker.toBuffer();

            await client.sendMessage(m.chat, {
                sticker: stickerBuffer
            }, { quoted: m });

        } catch (error) {
            console.error('brat command crashed because of you:', error);

            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            let errorMessage = 'your sticker failed. shocking.';

            if (error.message.includes('status')) {
                errorMessage = 'api died from cringe. try again when your text is less stupid.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'your internet is as weak as your personality.';
            } else {
                errorMessage = `even the error is embarrassed: ${error.message}`;
            }

            await client.sendMessage(m.chat, {
                text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 brat sticker failed, you disappointment.\n々 ${errorMessage}\n╭───( ✓ )───`
            }, { quoted: m });
        }
    }
};