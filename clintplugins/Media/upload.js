const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m } = context;

    try {
        // Get the quoted media or the message itself
        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!mime) return m.reply('Please quote or send a media file to upload.');

        // Download the media
        const mediaBuffer = await q.download();

        // Check for max site upload size (256MB)
        if (mediaBuffer.length > 256 * 1024 * 1024) {
            return m.reply('Media is too large. Max size is 256MB.');
        }

        // Save media temporarily
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        // Prepare FormData for API - UPDATED FUNCTION
        const form = new FormData();
        form.append('files[]', fs.createReadStream(tempFilePath));

        // Upload to qu.ax API - UPDATED ENDPOINT
        const response = await axios.post('https://qu.ax/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        // Clean up temporary file
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        // Check response
        const files = response.data?.files;
        if (!files || !files[0]?.url) throw new Error('No URL returned by API');

        const link = files[0].url;
        const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

        // Send success message
        await client.sendMessage(m.chat, {
            interactiveMessage: {
                header: "Media Uploaded Successfully ✅",
                title: `Media Link: \n\n${link}\n\nSize: ${fileSizeMB} MB`,
                footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Copy Link",
                            id: `copy_${Date.now()}`,
                            copy_code: link,
                        }),
                    },
                ],
            },
        }, { quoted: m });

    } catch (err) {
        console.error('Upload error:', err);
        m.reply(`Error during upload: ${err.message}`);
    }
};