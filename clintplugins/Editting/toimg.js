const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Upload function to send sticker to qu.ax and get a URL
async function uploadSticker(buffer) {
    const tempFilePath = path.join(__dirname, `temp_sticker_${Date.now()}.webp`);
    fs.writeFileSync(tempFilePath, buffer);

    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFilePath));

    try {
        const response = await axios.post('https://qu.ax/upload.php', form, {
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
    name: 'toimg',
    aliases: ['toimage', 'stickertoimg', 'sticker'],
    description: 'Converts stickers to images',
    run: async (context) => {
        const { client, m, mime } = context;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
        };

        // Check if message is quoted and is a sticker
        if (!m.quoted) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Yo, @${m.sender.split('@')[0]}! 😤 Please reply to a sticker!\nExample: Reply to a sticker with .toimg`),
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
            /**
             * Send loading message
             */
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply('Converting sticker to image... 🎨\nThis may take a moment ⏳')
            }, { quoted: m });

            // Step 1: Download sticker
            const stickerBuffer = await m.quoted.download();

            if (!stickerBuffer) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: formatStylishReply('Failed to download the sticker!\nPlease try again.')
                }, { quoted: m });
            }

            // Step 2: Upload sticker to get a public URL
            await client.sendMessage(m.chat, {
                text: formatStylishReply('Uploading sticker for conversion... 📤')
            }, { quoted: m });

            const { url: stickerUrl } = await uploadSticker(stickerBuffer);

            // Step 3: Call the conversion API
            await client.sendMessage(m.chat, {
                text: formatStylishReply('Converting to image format... 🔄')
            }, { quoted: m });

            const encodedUrl = encodeURIComponent(stickerUrl);
            const convertApiUrl = `https://api.elrayyxml.web.id/api/maker/convert?url=${encodedUrl}&format=PNG`;
            
            const response = await axios.get(convertApiUrl, {
                headers: { 
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 30000
            });

            // Validate API response
            if (!response.data.status || !response.data.result) {
                throw new Error('Conversion API failed to process the sticker');
            }

            const imageUrl = response.data.result;

            // Step 4: Download the converted image
            await client.sendMessage(m.chat, {
                text: formatStylishReply('Downloading converted image... 📥')
            }, { quoted: m });

            const imageResponse = await axios.get(imageUrl, {
                responseType: 'arraybuffer',
                timeout: 20000
            });

            const imageBuffer = Buffer.from(imageResponse.data);

            // Step 5: Delete loading message and send result
            await client.sendMessage(m.chat, { delete: loadingMsg.key });

            // Send as image
            await client.sendMessage(
                m.chat,
                { 
                    image: imageBuffer, 
                    caption: formatStylishReply('Sticker converted to image! 🖼️\nNow you can use it as a normal image!')
                },
                { quoted: m }
            );

            // Also send as document for better quality
            await client.sendMessage(
                m.chat,
                {
                    document: imageBuffer,
                    mimetype: 'image/png',
                    fileName: `converted_sticker_${Date.now()}.png`,
                    caption: formatStylishReply('PNG Version (Better Quality)\nUse this for best results!')
                },
                { quoted: m }
            );

        } catch (err) {
            console.error('ToImg conversion error:', err);
            
            // Delete loading message on error
            try {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
            } catch (e) {
                // Ignore delete errors
            }

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