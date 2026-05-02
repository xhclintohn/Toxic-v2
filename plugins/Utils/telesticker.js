import fetch from 'node-fetch';
import { Sticker, StickerTypes } from 'wa-sticker-formatter';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    const { client, m, text, prefix, packname, author } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    try {
        if (!text) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───\n├ \n├ Give me a Telegram sticker pack name or link!\n├ \n├ Example: ${prefix}ts itzel39\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        let packName = text.trim();
        if (packName.includes('t.me/addstickers/')) {
            const match = packName.match(/t\.me\/addstickers\/([a-zA-Z0-9_]+)/);
            if (match) packName = match[1];
        }

        const apiUrl = `https://t.me/addstickers/${packName}`;
        const encodedUrl = encodeURIComponent(apiUrl);
        const apiEndpoint = `https://api.nexray.web.id/tools/telegram-sticker?url=${encodedUrl}`;

        const response = await fetch(apiEndpoint, {
            method: 'GET',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (!response.ok) throw new Error(`API request failed: ${response.status}`);

        const data = await response.json();

        if (!data?.status || !data?.result?.sticker || data.result.sticker.length === 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───\n├ \n├ That sticker pack doesn't exist or\n├ your internet is worse than your face.\n├ \n├ Pack: ${packName}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const stickers = data.result.sticker;
        const packTitle = data.result.title || packName;

        await client.sendMessage(m.chat, { react: { text: '🔃', key: m.reactKey } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───\n├ \n├ Pack: ${packTitle}\n├ Total: ${stickers.length} stickers\n├ Converting to WhatsApp stickers...\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        let sentCount = 0;
        let failedCount = 0;
        let tgsSkipped = 0;

        for (let i = 0; i < stickers.length; i++) {
            try {
                const sticker = stickers[i];
                const stickerUrl = sticker.url;

                if (stickerUrl.endsWith('.tgs')) { tgsSkipped++; continue; }

                const isVideo = stickerUrl.endsWith('.webm');

                const stickerResponse = await fetch(stickerUrl);
                if (!stickerResponse.ok) throw new Error(`Download failed: ${stickerResponse.status}`);

                const stickerBuffer = Buffer.from(await stickerResponse.arrayBuffer());

                const waSticker = new Sticker(stickerBuffer, {
                    pack: packname || 'Telegram Sticker',
                    author: author || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                    type: isVideo ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ['🎨', '🎭'],
                    quality: 50,
                    emojis: sticker.emoji ? [sticker.emoji] : ['🤔']
                });

                const stickerBufferFinal = await waSticker.toBuffer();
                await client.sendMessage(m.chat, { sticker: stickerBufferFinal }, { quoted: fq });
                sentCount++;

                if ((i + 1) % 3 === 0) await new Promise(r => setTimeout(r, 1000));

            } catch { failedCount++; }
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });

        const extraNote = tgsSkipped > 0 ? `\n├ Skipped ${tgsSkipped} .tgs (not supported)` : '';
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Tᴇʟᴇɢʀᴀᴍ Sᴛɪᴄᴋᴇʀ ≪───\n├ \n├ Success: ${sentCount} stickers\n├ Failed: ${failedCount} stickers${extraNote}\n├ Pack: ${packTitle}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Something broke!\n├ Either the API is dead or\n├ your sticker pack name is trash.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
