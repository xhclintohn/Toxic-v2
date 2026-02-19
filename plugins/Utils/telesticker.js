const fetch = require("node-fetch");
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');
const { queue } = require('async');

// Queue to prevent rate limiting - processes one sticker at a time
const stickerQueue = queue(async (task, callback) => {
    try {
        await task();
    } catch (error) {
        console.error(`Queue error: ${error.message}`);
    }
    callback();
}, 1); // Process 1 sticker at a time

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
            // Extract pack name from link
            const match = text.match(/t\.me\/addstickers\/([a-zA-Z0-9_]+)/);
            if (match) packName = match[1];
            apiUrl = text; // Use full link
        } else {
            // Assume it's a pack name, build Telegram link
            apiUrl = `https://t.me/addstickers/${packName}`;
        }

        console.log(`Fetching sticker pack: ${packName}`);
        console.log(`Telegram URL: ${apiUrl}`);

        // Use the correct API endpoint
        const encodedUrl = encodeURIComponent(apiUrl);
        const apiEndpoint = `https://api.nexray.web.id/tools/telegram-sticker?url=${encodedUrl}`;
        
        console.log(`API Endpoint: ${apiEndpoint}`);
        
        const response = await fetch(apiEndpoint, {
            method: "GET",
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        if (!response.ok) {
            console.error(`API returned status: ${response.status}`);
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(`API Response status:`, data.status);
        console.log(`Total stickers found:`, data?.result?.sticker?.length || 0);

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

        // Process stickers with queue system
        for (let i = 0; i < stickers.length; i++) {
            stickerQueue.push(async () => {
                try {
                    const sticker = stickers[i];
                    const stickerUrl = sticker.url;

                    // Skip .tgs files (Telegram animated stickers)
                    if (stickerUrl.endsWith('.tgs')) {
                        tgsSkipped++;
                        console.log(`Skipped .tgs sticker ${i + 1}`);
                        return;
                    }

                    console.log(`Processing sticker ${i + 1}/${stickers.length}`);

                    // Determine file extension
                    const isVideo = stickerUrl.endsWith('.webm');
                    const ext = isVideo ? 'webm' : 'webp';
                    const tempFile = path.join(__dirname, `temp-telesticker-${Date.now()}-${i}.${ext}`);

                    // Download sticker
                    const stickerResponse = await fetch(stickerUrl);
                    if (!stickerResponse.ok) {
                        throw new Error(`Failed to download sticker: ${stickerResponse.status}`);
                    }
                    
                    const stickerBuffer = Buffer.from(await stickerResponse.arrayBuffer());
                    await fs.writeFile(tempFile, stickerBuffer);

                    // Convert to WhatsApp sticker using wa-sticker-formatter
                    const waSticker = new Sticker(tempFile, {
                        pack: packname || 'Telegram Sticker',
                        author: author || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                        type: isVideo ? StickerTypes.CROPPED : StickerTypes.FULL,
                        categories: ['🎨', '🎭'],
                        quality: 50, // Better quality like your stocker.js
                        background: 'transparent',
                        emojis: sticker.emoji ? [sticker.emoji] : ['🤔']
                    });

                    const stickerBufferFinal = await waSticker.toBuffer();

                    // Send to WhatsApp
                    await client.sendMessage(m.chat, { 
                        sticker: stickerBufferFinal 
                    }, { quoted: m });

                    sentCount++;
                    console.log(`✅ Sent sticker ${i + 1}/${stickers.length}`);

                    // Clean up temp file
                    await fs.unlink(tempFile).catch(() => {});

                    // Small delay between stickers to avoid rate limiting
                    if ((i + 1) % 3 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }

                } catch (stickerError) {
                    failedCount++;
                    console.error(`❌ Failed sticker ${i + 1}:`, stickerError.message);
                }
            });
        }

        // Wait for all stickers to be processed
        await new Promise((resolve) => {
            stickerQueue.drain(() => {
                console.log('All stickers processed');
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
├ Error: ${error.message}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
