const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const util = require('util');

module.exports = async (context) => {
    const { client, m } = context;

    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || '';

    if (!mime) return m.reply('Quote an image or video');

    let mediaBuffer = await q.download();

    if (mediaBuffer.length > 10 * 1024 * 1024) return m.reply('Media is too large.');

    let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);

    if (isTele) {
        // Save the media temporarily
        let fta2 = await client.downloadAndSaveMediaMessage(q);

        // Create FormData for the API request
        const form = new FormData();
        form.append('files[]', fs.createReadStream(fta2));

        try {
            // Make the POST request to the qu.ax API
            const response = await axios.post('https://qu.ax/upload.php', form, {
                headers: {
                    ...form.getHeaders(),
                },
            });

            // Extract the file URL from the response
            const link = response.data.files[0].url;
            if (!link) throw new Error('No URL returned in response');

            const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

            // Send the success message with the link
            await client.sendMessage(m.chat, {
                interactiveMessage: {
                    header: "Media Uploaded Successfully ✅",
                    title: `Media Link: \n\n${link}\n\n`,
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

            // Clean up the temporary file
            if (fs.existsSync(fta2)) {
                fs.unlinkSync(fta2);
            }
        } catch (error) {
            console.error('Upload error:', error.message);
            m.reply(`Error occurred during upload: ${error.message}`);
        }
    } else {
        m.reply(`Error: Unsupported media type.`);
    }
};