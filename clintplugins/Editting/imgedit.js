const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'file' });
    const response = await axios.post('https://catbox.moe/user/api.php', form, { 
        headers: form.getHeaders(),
        timeout: 30000
    });
    if (!response.data || typeof response.data !== 'string') throw new Error('Upload Refused');
    return response.data.trim();
}

module.exports = async (context) => {
    const { client, m, text } = context;
    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        if (!m.quoted) return m.reply("Quote an image, you blind fuck.");
        const q = m.quoted;
        const mime = q.mimetype || '';
        if (!mime.startsWith('image/')) return m.reply("That's not an image, idiot.");

        const prompt = text || "make it look epic";
        const mediaBuffer = await q.download();

        const uploadedUrl = await uploadToCatbox(mediaBuffer);

        // Use a different endpoint or try without .id
        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(uploadedUrl)}&prompt=${encodeURIComponent(prompt)}`;

        // Try with more realistic browser headers
        const editResponse = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://api-faa.my.id/',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'image',
                'Sec-Fetch-Mode': 'no-cors',
                'Sec-Fetch-Site': 'same-origin',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            },
            timeout: 60000
        });
        
        // Check if response is actually an image
        const contentType = editResponse.headers['content-type'] || '';
        if (!contentType.includes('image/')) {
            throw new Error('API returned non-image content');
        }

        if (!editResponse.data || editResponse.data.length === 0) {
            throw new Error('API returned empty image');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            image: editResponse.data,
            caption: `Done. Prompt: "${prompt}"\n—\nTσxιƈ-ɱԃȥ`
        }, { quoted: m });

    } catch (error) {
        console.error('Edit Error Details:', {
            message: error.message,
            response: error.response?.data?.toString().substring(0, 200)
        });
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`Edit failed. The API is being a bitch.\nError: ${error.message}`);
    }
};