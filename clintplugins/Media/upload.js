const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';
        if (!mime) return m.reply('Please quote or send a media file to upload.');
        const mediaBuffer = await q.download();
        const fileExtension = getExtensionFromMime(mime);
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}${fileExtension}`);
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
        
        // Send message with cta_copy button
        await client.sendMessage(m.chat, {
            interactiveMessage: {
                header: "📤 Media Uploaded Successfully ✅",
                title: `🔗 Link: ${link}\n📊 Size: ${fileSizeMB} MB`,
                footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "📋 Copy Link",
                            id: `copy_${Date.now()}`,
                            copy_code: link,
                        }),
                    },
                ],
            },
        }, { quoted: m });

    } catch (err) {
        console.error('Upload error:', err);
        let errorMsg = `Error during upload: ${err.message}`;
        if (err.response) {
            errorMsg += `\nStatus: ${err.response.status}`;
            if (err.response.data) {
                errorMsg += `\nResponse: ${JSON.stringify(err.response.data)}`;
            }
        }
        m.reply(errorMsg);
    }
};

function getExtensionFromMime(mime) {
    const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'video/mp4': '.mp4',
        'audio/mpeg': '.mp3',
        'audio/mp4': '.m4a',
        'audio/ogg': '.ogg',
        'application/pdf': '.pdf',
        'text/plain': '.txt',
    };
    return mimeToExt[mime.toLowerCase()] || '.bin';
}