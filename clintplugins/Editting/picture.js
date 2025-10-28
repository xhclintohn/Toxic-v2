const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Upload function to send image to qu.ax and get a URL
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

    // Determine whether the image is from quoted or current message
    const quoted = m.quoted ? m.quoted : m;
    const quotedMime = quoted.mimetype || mime || '';

    if (!/image/.test(quotedMime)) {
        return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Please reply to or send an image with this command.\n◈━━━━━━━━━━━━━━━━◈');
    }

    await m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Enhancing your image. Please wait... 🗿\n◈━━━━━━━━━━━━━━━━◈');

    try {
        // Step 1: Download image
        const media = await quoted.download();

        if (!media) {
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Failed to download the image. Try again.\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Step 2: Size limit check
        if (media.length > 10 * 1024 * 1024) {
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ The image is too large (max 10MB).\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Step 3: Upload image to get a public URL
        const { url: imageUrl } = await uploadImage(media);

        // Step 4: Call the upscale API
        const response = await axios.get('https://fgsi.koyeb.app/api/tools/upscale', {
            params: {
                apikey: 'fgsiapi-2dcdfa06-6d',
                url: imageUrl,
            },
            headers: { accept: 'application/json' },
            responseType: 'arraybuffer',
        });

        const enhancedImage = Buffer.from(response.data);

        // Step 5: Send enhanced image
        await client.sendMessage(
            m.chat,
            { image: enhancedImage, caption: '◈━━━━━━━━━━━━━━━━◈\n❒ Your image has been enhanced to HD.\n◈━━━━━━━━━━━━━━━━◈' },
            { quoted: m }
        );
    } catch (err) {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Error: ${err.message}\n◈━━━━━━━━━━━━━━━━◈`);
    }
};