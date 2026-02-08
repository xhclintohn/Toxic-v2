const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');
const { queue } = require('async');

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`WatermarkSticker error: ${error.message}`);
    }
    callback();
}, 1);

module.exports = async (context) => {
    const { client, m, mime, pushname } = context;

    if (!m.sender.includes('your-owner-number@s.whatsapp.net')) {
        return m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` Only owners can use this command.\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');
    }

    commandQueue.push({
        context,
        run: async ({ client, m, mime, pushname }) => {
            try {
                if (!m.quoted) {
                    return m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` Quote an image, a short video, or a sticker to change watermark.\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');
                }

                if (!/image|video|image\/webp/.test(mime)) {
                    return m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` This is neither a sticker, image, nor a short video!\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');
                }

                if (m.quoted.videoMessage && m.quoted.videoMessage.seconds > 30) {
                    return m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` Videos must be 30 seconds or shorter.\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');
                }

                const tempFile = path.join(__dirname, `temp-watermark-${Date.now()}.${/image\/webp/.test(mime) ? 'webp' : /image/.test(mime) ? 'jpg' : 'mp4'}`);
                await m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` A moment, Toxic-MD is creating the sticker...\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');

                const media = await client.downloadAndSaveMediaMessage(m.quoted, tempFile);

                const stickerResult = new Sticker(media, {
                    pack: pushname || 'ᅠᅠᅠᅠ',
                    author: pushname || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                    type: StickerTypes.FULL,
                    categories: ['🤩', '🎉'],
                    id: '12345',
                    quality: 50,
                    background: 'transparent'
                });

                const buffer = await stickerResult.toBuffer();
                await client.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

                await fs.unlink(tempFile).catch(() => console.warn('Failed to delete temp file'));
            } catch (error) {
                console.error(`WatermarkSticker error: ${error.message}`);
                await m.reply('╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───\n`々` An error occurred while creating the sticker. Please try again.\n╭───(    `𝐓𝐨𝐱𝐢𝐜-𝐌D`    )───');
            }
        }
    });
};