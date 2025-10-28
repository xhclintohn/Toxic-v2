const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');
const { queue } = require('async');

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Sticker error: ${error.message}`);
    }
    callback();
}, 1);

module.exports = async (context) => {
    const { client, m, mime, packname, author } = context;

    commandQueue.push({
        context,
        run: async ({ client, m, mime, packname, author }) => {
            try {
                // Determine the target media
                const quoted = m.quoted ? m.quoted : m;
                const quotedMime = quoted.mimetype || mime || '';

                if (!/image|video/.test(quotedMime)) {
                    return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Please send or reply to an image or a short video.\n◈━━━━━━━━━━━━━━━━◈');
                }

                if (quoted.videoMessage && quoted.videoMessage.seconds > 30) {
                    return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Videos must be 30 seconds or shorter.\n◈━━━━━━━━━━━━━━━━◈');
                }

                await m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Creating your sticker... please wait.\n◈━━━━━━━━━━━━━━━━◈');

                const tempFile = path.join(__dirname, `temp-sticker-${Date.now()}.${/image/.test(quotedMime) ? 'jpg' : 'mp4'}`);
                const media = await client.downloadAndSaveMediaMessage(quoted, tempFile);

                const sticker = new Sticker(media, {
                    pack: packname || 'Toxic-MD Pack',
                    author: author || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 [dev]',
                    type: StickerTypes.FULL,
                    categories: ['🤩', '🎉'],
                    id: '12345',
                    quality: 50,
                    background: 'transparent'
                });

                const buffer = await sticker.toBuffer();
                await client.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

                await fs.unlink(tempFile).catch(() => {});
            } catch (error) {
                console.error(`Sticker error: ${error.message}`);
                await m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Error while creating sticker. Try again.\n◈━━━━━━━━━━━━━━━━◈');
            }
        }
    });
};