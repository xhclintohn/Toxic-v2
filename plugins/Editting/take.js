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
        return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TAKE ≪───\n├ \n├ Only owners can use this command.\n├ Back off, peasant.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    commandQueue.push({
        context,
        run: async ({ client, m, mime, pushname }) => {
            try {
                if (!m.quoted) {
                    return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TAKE ≪───\n├ \n├ Quote an image, a short video,\n├ or a sticker to change watermark.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                }

                if (!/image|video|image\/webp/.test(mime)) {
                    return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TAKE ≪───\n├ \n├ This is neither a sticker, image,\n├ nor a short video!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                }

                if (m.quoted.videoMessage && m.quoted.videoMessage.seconds > 30) {
                    return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TAKE ≪───\n├ \n├ Videos must be 30 seconds or shorter.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                }

                const tempFile = path.join(__dirname, `temp-watermark-${Date.now()}.${/image\/webp/.test(mime) ? 'webp' : /image/.test(mime) ? 'jpg' : 'mp4'}`);
                await m.reply('╭───(    TOXIC-MD    )───\n├───≫ TAKE ≪───\n├ \n├ A moment, Toxic-MD is creating\n├ the sticker...\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

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
                await m.reply('╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ An error occurred while creating\n├ the sticker. Try again, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }
        }
    });
};