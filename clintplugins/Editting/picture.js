const fs = require('fs').promises;
const path = require('path');
const { queue } = require('async');


const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Picture error: ${error.message}`);
    }
    callback();
}, 1);

module.exports = async (context) => {
    const { client, m } = context;

    commandQueue.push({
        context,
        run: async ({ client, m }) => {
            try {
                await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

                if (!m.quoted) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply("Quote a sticker, you blind fuck. How hard is that?");
                }

                const quotedMime = m.quoted.mimetype || '';
                if (!/webp/.test(quotedMime)) {
                    await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    return m.reply("That's not a sticker, genius. Quote an actual .webp sticker.");
                }

                const tempSticker = path.join(__dirname, `temp-sticker-${Date.now()}.webp`);
                const outputImage = path.join(__dirname, `converted-${Date.now()}.jpg`);

                const mediaPath = await client.downloadAndSaveMediaMessage(m.quoted, tempSticker.replace('.webp', ''));

                const { exec } = require('child_process');
                await new Promise((resolve, reject) => {
                    exec(`ffmpeg -i "\( {mediaPath}" " \){outputImage}" -y`, (err) => {
                        if (err) return reject(err);
                        resolve();
                    });
                });

                const imageBuffer = await fs.readFile(outputImage);

                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                await client.sendMessage(m.chat, {
                    image: imageBuffer,
                    caption: "Sticker → Image. Done. Don't say I never did anything for you.\n—\nTσxιƈ-ɱԃȥ"
                }, { quoted: m });

           
                await fs.unlink(mediaPath).catch(() => {});
                await fs.unlink(outputImage).catch(() => {});

            } catch (error) {
                console.error(`Picture error: ${error.message}`);
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                m.reply("Conversion failed. Your sticker is probably cursed.\nTry again or cry about it.");
            }
        }
    });
};