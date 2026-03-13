const fetch = require("node-fetch");
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');
const { queue } = require('async');

const stickerQueue = queue(async (task, callback) => {
    try {
        await task();
    } catch (error) {
        console.error(`Queue error: ${error.message}`);
    }
    callback();
}, 1);

module.exports = async (context) => {
    const { client, m, text, prefix, packname, author } = context;

    try {
        if (!text) return m.reply(`╭───(    TOXIC-MD    )───
├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───
├ 
├ Are you mentally challenged? Give me a
├ Telegram sticker pack name or link!
├ 
├ Example: ${prefix}telesticker itzel39
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let packName = text;
        let apiUrl;

        if (text.includes("t.me/addstickers/")) {
            const match = text.match(/t\.me\/addstickers\/([a-zA-Z0-9_]+)/);
            if (match) packName = match[1];
            apiUrl = text;
        } else {
            apiUrl = `https://t.me/addstickers/${packName}`;
        }

        const encodedUrl = encodeURIComponent(apiUrl);
        const apiEndpoint = `https://api.nexray.web.id/tools/telegram-sticker?url=${encodedUrl}`;
        
        const response = await fetch(apiEndpoint, {
            method: "GET",
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data?.status || !data?.result?.sticker || data.result.sticker.length === 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───
├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───
├ 
├ That sticker pack doesn't exist or
├ your internet is worse than your face.
├ 
├ Pack: ${packName}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const stickers = data.result.sticker;
        const packTitle = data.result.title || packName;

        await client.sendMessage(m.chat, { 
            react: { text: '🔃', key: m.key } 
        });

        await m.reply(`╭───(    TOXIC-MD    )───
├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───
├ 
├ 📦 Pack: ${packTitle}
├ 📊 Total: ${stickers.length} stickers
├ ⏳ Converting to WhatsApp stickers...
├ 🧠 Try not to spam, moron.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        let sentCount = 0;
        let failedCount = 0;
        let tgsSkipped = 0;

        for (let i = 0; i < stickers.length; i++) {
            stickerQueue.push(async () => {
                try {
                    const sticker = stickers[i];
                    const stickerUrl = sticker.url;

                    if (stickerUrl.endsWith('.tgs')) {
                        tgsSkipped++;
                        return;
                    }

                    const isVideo = stickerUrl.endsWith('.webm');
                    const ext = isVideo ? 'webm' : 'webp';
                    const tempFile = path.join(__dirname, `temp-telesticker-${Date.now()}-${i}.${ext}`);

                    const stickerResponse = await fetch(stickerUrl);
                    if (!stickerResponse.ok) {
                        throw new Error(`Failed to download sticker: ${stickerResponse.status}`);
                    }
                    
                    const stickerBuffer = Buffer.from(await stickerResponse.arrayBuffer());
                    await fs.writeFile(tempFile, stickerBuffer);

                    const waSticker = new Sticker(tempFile, {
                        pack: packname || 'Telegram Sticker',
                        author: author || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                        type: isVideo ? StickerTypes.CROPPED : StickerTypes.FULL,
                        categories: ['🎨', '🎭'],
                        quality: 50,
                        background: 'transparent',
                        emojis: sticker.emoji ? [sticker.emoji] : ['🤔']
                    });

                    const stickerBufferFinal = await waSticker.toBuffer();

                    await client.sendMessage(m.chat, { 
                        sticker: stickerBufferFinal 
                    }, { quoted: m });

                    sentCount++;

                    await fs.unlink(tempFile).catch(() => {});

                    if ((i + 1) % 3 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (stickerError) {
                    failedCount++;
                }
            });
        }

        await new Promise((resolve) => {
            stickerQueue.drain(() => {
                resolve();
            });
        });

        await client.sendMessage(m.chat, { 
            react: { text: '✅', key: m.key } 
        });

        let extraNote = '';
        if (tgsSkipped > 0) {
            extraNote = `\n├ ⚠️ Skipped ${tgsSkipped} .tgs stickers (not supported)`;
        }

        await m.reply(`╭───(    TOXIC-MD    )───
├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───
├ 
├ ✅ Success: ${sentCount} stickers
├ ❌ Failed: ${failedCount} stickers${extraNote}
├ 📦 Pack: ${packTitle}
├ 
├ Now go annoy someone with these.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
        console.error("Telegram sticker error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───
├───≫ Eʀʀᴏʀ ≪───
├ 
├ Something broke, you donkey!
├ Either the API is dead or
├ your sticker pack name is trash.
├ 
├ Fix: Try again or use a different pack
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
