const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'file' }); // Let catbox detect format
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
        console.log('Uploaded to:', uploadedUrl); // Debug log

        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(uploadedUrl)}&prompt=${encodeURIComponent(prompt)}`;
        console.log('API URL:', apiUrl); // Debug log

        const editResponse = await axios.get(apiUrl, { 
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*,*/*'
            },
            timeout: 45000
        });
        
        if (!editResponse.data || editResponse.data.length === 0) {
            throw new Error('API returned empty image');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            image: editResponse.data,
            caption: `Done. Prompt: "${prompt}"\n—\nTσxιƈ-ɱԃȥ`
        }, { quoted: m });

    } catch (error) {
        console.error('Edit Error:', error); // Debug log
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`Edit failed. API or your image is trash.\nError: ${error.message}`);
    }
};