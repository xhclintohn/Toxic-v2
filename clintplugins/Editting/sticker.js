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
    const { client, m, packname, author } = context;

    await client.sendMessage(m.chat, { react: { text: '🔃', key: m.key } });

    commandQueue.push({
        context,
        run: async ({ client, m }) => {
            try {
                let quoted = m.quoted || m;

                // Robust media detection - handles caption messages properly
                let mediaMessage = quoted.message?.imageMessage || 
                                   quoted.message?.videoMessage ||
                                   quoted.message?.stickerMessage ||
                                   m.message?.imageMessage || 
                                   m.message?.videoMessage;

                if (!mediaMessage) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply("Where's the fvcking image or short video idiot.😑");
                }

                const isVideo = !!mediaMessage.videoMessage;
                if (isVideo && mediaMessage.videoMessage.seconds > 30) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply('Videos must be 30 seconds or shorter.');
                }

                const tempFile = path.join(__dirname, `temp-sticker-\( {Date.now()}. \){isVideo ? 'mp4' : 'jpg'}`);
                const mediaPath = await client.downloadAndSaveMediaMessage(quoted, tempFile.replace(path.extname(tempFile), ''));

                const sticker = new Sticker(mediaPath, {
                    pack: packname || 'p',
                    author: author || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 [dev]',
                    type: StickerTypes.FULL,
                    categories: ['🤩', '🎉'],
                    id: '12345',
                    quality: 50,
                    background: 'transparent'
                });

                const buffer = await sticker.toBuffer();

                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                await client.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

                await fs.unlink(mediaPath).catch(() => {});
                if (mediaPath !== tempFile) await fs.unlink(tempFile).catch(() => {});

            } catch (error) {
                console.error(`Sticker error: ${error.message}`);
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                await m.reply('Error while creating sticker. Try again.');
            }
        }
    });
};