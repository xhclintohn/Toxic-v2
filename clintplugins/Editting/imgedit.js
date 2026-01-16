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

        // request edited image (RAW IMAGE RESPONSE)
        const res = await axios.get(
            'https://api-faa.my.id/faa/editfoto',
            {
                params: {
                    url: uploadedUrl,
                    prompt
                },
                responseType: 'arraybuffer',
                timeout: 60000,
                headers: {
                    'User-Agent': 'Mozilla/5.0',
                    'Accept': 'image/*'
                }
            }
        );

        const contentType = res.headers['content-type'] || '';
        if (!contentType.startsWith('image/')) {
            throw new Error(`Non-image response: ${contentType}`);
        }

        if (!res.data || res.data.length < 1000) {
            throw new Error('Image buffer is empty or too small');
        }

        // reaction: success
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        // send image
        await client.sendMessage(
            m.chat,
            {
                image: Buffer.from(res.data),
                caption: `Done.\nPrompt: "${prompt}"\n—\nTσxιƈ-ɱԃȥ`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error('Edit Error:', {
            message: err.message,
            status: err.response?.status,
            contentType: err.response?.headers?.['content-type']
        });

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`Edit failed.\nError: ${err.message}`);
    }
};