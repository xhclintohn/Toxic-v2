const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadSticker(buffer) {
    const tempFilePath = path.join(__dirname, `temp_sticker_${Date.now()}.webp`);
    fs.writeFileSync(tempFilePath, buffer);
    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFilePath));
    try {
        const response = await axios.post('https://qu.ax/upload', form, {
            headers: form.getHeaders(),
        });
        const link = response.data?.files?.[0]?.url;
        if (!link) throw new Error('No URL returned in response');
        fs.unlinkSync(tempFilePath);
        return { url: link };
    } catch (error) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error(`Upload error: ${error.message}`);
    }
}

module.exports = {
    name: 'tomp4',
    aliases: ['tovideo', 'stickertomp4', 'sticker2video'],
    description: 'Converts stickers to MP4 videos',
    run: async (context) => {
        const { client, m, mime } = context;
        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
        };
        if (!m.quoted) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Yo, @${m.sender.split('@')[0]}! 😤 Please reply to a sticker!\nExample: Reply to a sticker with .tomp4`),
                mentions: [m.sender]
            }, { quoted: m });
        }
        const quotedMime = m.quoted.mimetype || '';
        if (!/webp/.test(quotedMime)) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply('Thats not a sticker! 😤\nPlease reply to a sticker file.')
            }, { quoted: m });
        }
        try {
            const stickerBuffer = await m.quoted.download();
            if (!stickerBuffer) {
                return client.sendMessage(m.chat, {
                    text: formatStylishReply('Failed to download the sticker!\nPlease try again.')
                }, { quoted: m });
            }
            const { url: stickerUrl } = await uploadSticker(stickerBuffer);
            const encodedUrl = encodeURIComponent(stickerUrl);
            const convertApiUrl = `https://api.elrayyxml.web.id/api/maker/convert?url=${encodedUrl}&format=MP4`;
            const response = await axios.get(convertApiUrl, {
                headers: { 
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 30000
            });
            if (!response.data.status || !response.data.result) {
                throw new Error('Conversion API failed to process the sticker');
            }
            const videoUrl = response.data.result;
            const videoResponse = await axios.get(videoUrl, {
                responseType: 'arraybuffer',
                timeout: 20000
            });
            const videoBuffer = Buffer.from(videoResponse.data);
            await client.sendMessage(
                m.chat,
                { 
                    video: videoBuffer, 
                    caption: formatStylishReply('Sticker converted to MP4! 🎬\nNow you can use it as a video!')
                },
                { quoted: m }
            );
            await client.sendMessage(
                m.chat,
                {
                    document: videoBuffer,
                    mimetype: 'video/mp4',
                    fileName: `converted_sticker_${Date.now()}.mp4`,
                    caption: formatStylishReply('MP4 Version (Better Quality)\nUse this for best results!')
                },
                { quoted: m }
            );
        } catch (err) {
            console.error('ToVideo conversion error:', err);
            let errorMessage = 'An unexpected error occurred';
            if (err.message.includes('timeout')) {
                errorMessage = 'Conversion timed out. The sticker might be too large.';
            } else if (err.message.includes('Network Error')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (err.message.includes('Upload error')) {
                errorMessage = 'Failed to upload sticker for processing.';
            } else if (err.message.includes('Conversion API failed')) {
                errorMessage = 'The conversion service failed to process this sticker.';
            } else if (err.message.includes('animated')) {
                errorMessage = 'Animated stickers are not supported yet!';
            } else {
                errorMessage = err.message;
            }
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Conversion Failed! 😤\nError: ${errorMessage}\n\nTips:\n• Use static stickers only\n• Try with smaller stickers\n• Check your internet connection`)
            }, { quoted: m });
        }
    }
};