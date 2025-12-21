const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.png' });
    const response = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
    if (!response.data || !response.data.includes('catbox')) throw new Error('Upload Refused');
    return response.data;
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

        // FIXED LINE HERE
        const apiUrl = `https://api-faa.my.id/faa/editfoto?url=\( {encodeURIComponent(uploadedUrl)}&prompt= \){encodeURIComponent(prompt)}`;

        const editResponse = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            image: Buffer.from(editResponse.data),
            caption: `Done. Prompt: "${prompt}"\n—\nTσxιƈ-ɱԃȥ`
        }, { quoted: m });

    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`Edit failed. API or your image is trash.\nError: ${error.message}`);
    }
};