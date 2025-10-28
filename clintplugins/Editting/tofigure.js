const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Function to upload image to qu.ax and get a URL
async function uploadImage(buffer) {
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, buffer);

    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFilePath));

    try {
        const response = await axios.post('https://qu.ax/upload.php', form, {
            headers: form.getHeaders(),
        });

        const link = response.data?.files?.[0]?.url;
        if (!link) throw new Error('No URL returned in response');

        fs.unlinkSync(tempFilePath);
        return { url: link };
    } catch (error) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error(`Upload error: ${error.message}`);
    }
}

module.exports = async (context) => {
    const { client, mime, m } = context;

    // Choose between quoted or direct message
    const quoted = m.quoted ? m.quoted : m;
    const quotedMime = quoted.mimetype || mime || '';

    if (!/image/.test(quotedMime)) {
        return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Please reply to or send an image with this command.\n◈━━━━━━━━━━━━━━━━◈');
    }

    await m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Creating your figure-style image... Please wait ✨\n◈━━━━━━━━━━━━━━━━◈');

    try {
        // Step 1: Download the image buffer
        const media = await quoted.download();
        if (!media) {
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Failed to download the image. Try again.\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Step 2: Limit size to 10MB
        if (media.length > 10 * 1024 * 1024) {
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ The image is too large (max 10MB).\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Step 3: Upload to get public URL
        const { url: imageUrl } = await uploadImage(media);

        // Step 4: Call the tofigur API
        const apiURL = `https://api.fikmydomainsz.xyz/imagecreator/tofigur?url=${encodeURIComponent(imageUrl)}`;
        const response = await axios.get(apiURL);

        // Step 5: Validate API response
        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('Invalid response from API');
        }

        const resultUrl = response.data.result;

        // Step 6: Download the generated figure image
        const figureBuffer = (await axios.get(resultUrl, { responseType: 'arraybuffer' })).data;

        // Step 7: Send back the image
        await client.sendMessage(
            m.chat,
            {
                image: Buffer.from(figureBuffer),
                caption: '◈━━━━━━━━━━━━━━━━◈\n❒ Your image has been turned into a figure-style art! 🎨\n◈━━━━━━━━━━━━━━━━◈',
            },
            { quoted: m }
        );
    } catch (err) {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Error while generating figure image:\n${err.message}\n◈━━━━━━━━━━━━━━━━◈`);
    }
};