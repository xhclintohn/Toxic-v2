const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const q = m.quoted ? m.quoted : m;
        const mediaBuffer = await q.download();
        
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}.bin`);
        fs.writeFileSync(tempFilePath, mediaBuffer);
        
        const form = new FormData();
        form.append('files[]', fs.createReadStream(tempFilePath));
        
        const response = await axios.post('https://qu.ax/upload', form, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 30000,
        });
        
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        
        let link;
        if (response.data?.files?.[0]?.url) {
            link = response.data.files[0].url;
        } else if (response.data?.url) {
            link = response.data.url;
        } else if (response.data?.link) {
            link = response.data.link;
        } else if (response.data) {
            link = response.data;
        } else {
            throw new Error('No URL returned by API');
        }
        
        const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);
        const fileSizeKB = (mediaBuffer.length / 1024).toFixed(2);
        
        await client.sendMessage(m.chat, {
            text: `╔═════ ✪〘 MEDIA UPLOADED 〙✪ ═════╗
║
║ 📤 *Upload Status:* ✅ Successful
║ 🔗 *Direct Link:* ${link}
║ 📊 *File Size:* ${fileSizeMB} MB / ${fileSizeKB} KB
║ 📝 *Preview:* ${link.slice(0, 50)}...
║
╠═══════════════════════════════╝
║
║ 💡 *Tip:* Copy the link above
║ 👤 *Requested by:* @${m.sender.split('@')[0]}
║ 🤖 *Powered by:* Tσxιƈ-ɱԃȥ
║
╚═══════════════════════════════╝`,
            mentions: [m.sender]
        }, { quoted: m });

    } catch (err) {
        console.error('Upload error:', err);
        let errorMsg = `❌ Upload Failed:\n${err.message}`;
        if (err.response) {
            errorMsg += `\n📡 Status: ${err.response.status}`;
            if (err.response.data) {
                errorMsg += `\n📄 Response: ${JSON.stringify(err.response.data)}`;
            }
        }
        m.reply(errorMsg);
    }
};