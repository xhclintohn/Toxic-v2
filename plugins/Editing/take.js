const { Sticker, StickerTypes } = require('wa-sticker-formatter');
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
    const { client, m, pushname } = context;

    commandQueue.push({
        context,
        run: async ({ client, m, pushname }) => {
            try {
                let mediaMessage = null;
                let mediaSource = null;

                if (m.message && (m.message.imageMessage || m.message.videoMessage || m.message.ptvMessage || m.message.stickerMessage)) {
                    mediaMessage = m.message.imageMessage || m.message.videoMessage || m.message.ptvMessage || m.message.stickerMessage;
                    mediaSource = m;
                } else if (m.quoted && m.quoted.message) {
                    mediaMessage = m.quoted.message.imageMessage ||
                                  m.quoted.message.videoMessage ||
                                  m.quoted.message.ptvMessage ||
                                  m.quoted.message.stickerMessage;
                    mediaSource = m.quoted;
                } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
                    const quotedMsg = m.message.extendedTextMessage.contextInfo.quotedMessage;
                    mediaMessage = quotedMsg.imageMessage || quotedMsg.videoMessage || quotedMsg.ptvMessage || quotedMsg.stickerMessage;
                    mediaSource = { message: quotedMsg, key: m.key };
                }

                if (!mediaMessage || !mediaSource) {
                    return m.reply('╭───(    TOXIC-MD    )───\n├───≥ TAKE ≤───\n├ \n├ Quote or send an image, short video,\n├ or sticker to steal the watermark.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                }

                const mime = mediaMessage.mimetype || '';

                if (!/image|video|webp/.test(mime)) {
                    return m.reply('╭───(    TOXIC-MD    )───\n├───≥ TAKE ≤───\n├ \n├ That\'s not an image, video or sticker.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                }

                const videoSeconds = mediaMessage.seconds || 0;
                if (/video/.test(mime) && videoSeconds > 30) {
                    return m.reply('╭───(    TOXIC-MD    )───\n├───≥ TAKE ≤───\n├ \n├ Videos must be 30 seconds or shorter.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
                }

                const ext = /webp/.test(mime) ? 'webp' : /video/.test(mime) ? 'mp4' : 'jpg';
                const tempFile = path.join(__dirname, `temp-take-${Date.now()}.${ext}`);
                const mediaPath = await client.downloadAndSaveMediaMessage(mediaSource, tempFile.replace(path.extname(tempFile), ''));

                const stickerResult = new Sticker(mediaPath, {
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

                await fs.unlink(mediaPath).catch(() => {});
                if (mediaPath !== tempFile) await fs.unlink(tempFile).catch(() => {});

            } catch (error) {
                console.error(`WatermarkSticker error: ${error.message}`);
                await m.reply('╭───(    TOXIC-MD    )───\n├───≥ ERROR ≤───\n├ \n├ Error while creating sticker.\n├ Try again, loser.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }
        }
    });
};
