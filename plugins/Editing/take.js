const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

module.exports = async (context) => {
    const { client, m, pushname } = context;

    await client.sendMessage(m.chat, { react: { text: '🔃', key: m.key } });

    try {
        let mediaMessage = null;
        let mediaKey = null;

        if (m.message?.imageMessage) {
            mediaMessage = m.message.imageMessage;
            mediaKey = m.key;
        } else if (m.message?.videoMessage) {
            mediaMessage = m.message.videoMessage;
            mediaKey = m.key;
        } else if (m.message?.stickerMessage) {
            mediaMessage = m.message.stickerMessage;
            mediaKey = m.key;
        } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            mediaMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            mediaKey = m.key;
        } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage) {
            mediaMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.videoMessage;
            mediaKey = m.key;
        } else if (m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
            mediaMessage = m.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            mediaKey = m.key;
        } else if (m.quoted?.message?.imageMessage) {
            mediaMessage = m.quoted.message.imageMessage;
            mediaKey = m.quoted.key;
        } else if (m.quoted?.message?.videoMessage) {
            mediaMessage = m.quoted.message.videoMessage;
            mediaKey = m.quoted.key;
        } else if (m.quoted?.message?.stickerMessage) {
            mediaMessage = m.quoted.message.stickerMessage;
            mediaKey = m.quoted.key;
        }

        if (!mediaMessage || !mediaKey) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≥ TAKE ≤───\n├ \n├ Quote or send an image, short video,\n├ or sticker to steal the watermark.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const mime = mediaMessage.mimetype || '';

        if (!/image|video|webp/.test(mime)) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≥ TAKE ≤───\n├ \n├ That\'s not an image, video or sticker.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const videoSeconds = mediaMessage.seconds || 0;
        if (/video/.test(mime) && videoSeconds > 30) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≥ TAKE ≤───\n├ \n├ Videos must be 30 seconds or shorter.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const buffer = await downloadMediaMessage(mediaMessage, 'buffer', {}, {
            logger: console,
            reuploadRequest: client.updateMediaMessage
        });

        if (!buffer || buffer.length === 0) {
            throw new Error('Failed to download media');
        }

        const tempFile = path.join(__dirname, `temp-take-${Date.now()}.${/webp/.test(mime) ? 'webp' : /video/.test(mime) ? 'mp4' : 'jpg'}`);
        await fs.writeFile(tempFile, buffer);

        const stickerResult = new Sticker(tempFile, {
            pack: pushname || 'ᅠᅠᅠᅠ',
            author: pushname || '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
            type: StickerTypes.FULL,
            categories: ['🤩', '🎉'],
            id: '12345',
            quality: 50,
            background: 'transparent'
        });

        const stickerBuffer = await stickerResult.toBuffer();
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await client.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });

        await fs.unlink(tempFile).catch(() => {});

    } catch (error) {
        console.error('WatermarkSticker error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply('╭───(    TOXIC-MD    )───\n├───≥ ERROR ≤───\n├ \n├ Error while creating sticker.\n├ Try again, loser.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }
};