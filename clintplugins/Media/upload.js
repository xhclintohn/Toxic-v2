const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'file.png' });

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
    });

    if (!response.data || !response.data.includes('catbox')) {
        throw new Error('UPLOAD FAILED 🤦🏻');
    }

    return response.data;
}

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const q = m.quoted ? m.quoted : m;
        const mediaBuffer = await q.download();
        
        await m.reply(`UPLOADING TO CATBOX... 📤`);

        const link = await uploadToCatbox(mediaBuffer);
        
        const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);
        const fileSizeKB = (mediaBuffer.length / 1024).toFixed(2);
        
        await client.sendMessage(m.chat, {
            text: `╔═════ ✪〘 MEDIA UPLOADED 〙✪ ═════╗
║
║ 📤 *Upload Status:* ✅ Successful
║ 🌐 *Service:* Catbox.moe
║ 🔗 *Direct Link:* ${link}
║ 📊 *File Size:* ${fileSizeMB} MB / ${fileSizeKB} KB
║ 📝 *Preview:* ${link.slice(0, 50)}...
║
╠═══════════════════════════════╝
║
║ 💡 *Tip:* Link has NO EXPIRY
║ 👤 *Requested by:* @${m.sender.split('@')[0]}
║ 🤖 *Powered by:* Tσxιƈ-ɱԃȥ
║
╚═══════════════════════════════╝`,
            mentions: [m.sender]
        }, { quoted: m });

    } catch (err) {
        console.error('Upload error:', err);
        await m.reply(`UPLOAD FAILED 🤦🏻 ERROR: ${err.message}`);
    }
};