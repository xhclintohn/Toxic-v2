const axios = require('axios');
const FormData = require('form-data');

/**
 * Upload buffer to Catbox
 */
async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.jpg' });

    const res = await axios.post(
        'https://catbox.moe/user/api.php',
        form,
        {
            headers: form.getHeaders(),
            timeout: 30000
        }
    );

    if (typeof res.data !== 'string') {
        throw new Error('Catbox upload failed');
    }

    return res.data.trim();
}

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        // reaction: processing
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        if (!m.quoted) return m.reply('Reply to an image.');
        const q = m.quoted;

        const mime = q.mimetype || '';
        if (!mime.startsWith('image/')) {
            return m.reply('That is not an image.');
        }

        const prompt = text || 'make it look epic';

        const mediaBuffer = await q.download?.();
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            throw new Error('Failed to download image');
        }

        // upload image
        const uploadedUrl = await uploadToCatbox(mediaBuffer);

        // request edited image using new API
        const apiUrl = `https://www.movanest.xyz/v2/nanobanana?image_url=${encodeURIComponent(uploadedUrl)}&prompt=${encodeURIComponent(prompt)}&your_api_key=movanest-key17WR5ISK4U`;
        
        const res = await axios.get(
            apiUrl,
            {
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            }
        );

        // Check if response has the expected structure
        if (!res.data || !res.data.results || !res.data.results.resultUrl) {
            throw new Error('Invalid API response format');
        }

        const resultUrl = res.data.results.resultUrl;

        // Download the edited image
        const imageResponse = await axios.get(
            resultUrl,
            {
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            }
        );

        if (!imageResponse.data || imageResponse.data.length < 1000) {
            throw new Error('Edited image is empty or too small');
        }

        // reaction: success
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        // send image
        await client.sendMessage(
            m.chat,
            {
                image: Buffer.from(imageResponse.data),
                caption: `Done.\nPrompt: "${prompt}"\n—\nTσxιƈ-ɱԃȥ`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error('Edit Error:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data
        });

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`Edit failed.\nError: ${err.message}`);
    }
};