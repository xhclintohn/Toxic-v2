const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadImage(buffer) {
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.jpg`);
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
    name: 'hd',
    aliases: ['enhance', 'upscale'],
    description: 'Enhances image quality to HD using AI upscaling',
    run: async (context) => {
        const { client, m, mime } = context;
        const quoted = m.quoted ? m.quoted : m;
        const quotedMime = quoted.mimetype || mime || '';
        if (!/image/.test(quotedMime)) {
            return client.sendMessage(m.chat, {
                text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Please reply to or send an image with this command!\n│❒ Example: Reply to an image with .hd\n┗━━━━━━━━━━━━━━━┛'
            }, { quoted: m });
        }
        const loadingMsg = await client.sendMessage(m.chat, {
            text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Enhancing your image to HD...\n│❒ This may take a moment ⏳\n┗━━━━━━━━━━━━━━━┛'
        }, { quoted: m });
        try {
            const media = await quoted.download();
            if (!media) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Failed to download the image!\n│❒ Please try again with a different image\n┗━━━━━━━━━━━━━━━┛'
                }, { quoted: m });
            }
            if (media.length > 10 * 1024 * 1024) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Image is too large!\n│❒ Maximum size: 10MB\n┗━━━━━━━━━━━━━━━┛'
                }, { quoted: m });
            }
            const { url: imageUrl } = await uploadImage(media);
            const encodedUrl = encodeURIComponent(imageUrl);
            const upscaleApiUrl = `https://api.zenzxz.my.id/api/tools/upscale?url=${encodedUrl}`;
            const response = await axios.get(upscaleApiUrl, {
                headers: { 
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 60000
            });
            if (!response.data.success || !response.data.data?.url) {
                throw new Error('Upscale API failed to process the image');
            }
            const enhancedImageUrl = response.data.data.url;
            const enhancedResponse = await axios.get(enhancedImageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const enhancedImage = Buffer.from(enhancedResponse.data);
            await client.sendMessage(m.chat, { delete: loadingMsg.key });
            await client.sendMessage(
                m.chat,
                { 
                    image: enhancedImage, 
                    caption: '◈━━━━━━━━━━━━━━━━◈\n│❒ Image Enhanced to HD! 🎨\n│❒ Quality improved successfully\n┗━━━━━━━━━━━━━━━┛' 
                },
                { quoted: m }
            );
        } catch (err) {
            console.error('HD enhancement error:', err);
            try {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
            } catch (e) {}
            let errorMessage = 'An unexpected error occurred';
            if (err.message.includes('timeout')) {
                errorMessage = 'Processing timed out. The image might be too large or the server is busy.';
            } else if (err.message.includes('Network Error')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.message.includes('Upload error')) {
                errorMessage = 'Failed to upload image for processing.';
            } else if (err.message.includes('Upscale API failed')) {
                errorMessage = 'The enhancement service failed to process your image.';
            } else {
                errorMessage = err.message;
            }
            await client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Enhancement Failed! 😤\n│❒ Error: ${errorMessage}\n┗━━━━━━━━━━━━━━━┛`
            }, { quoted: m });
        }
    }
};