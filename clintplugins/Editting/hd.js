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
            headers: {
                ...form.getHeaders(),
            },
        });

        const link = response.data.files[0].url;
        if (!link) throw new Error('No URL returned in response');

        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }

        return { url: link };
    } catch (error) {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        throw new Error(`Upload error: ${error.message}`);
    }
}

module.exports = async (context) => {
    const { client, mime, m } = context;

    // Check if the input is an image
    if (!/image/.test(mime)) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Please send or reply to an image.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    // Send processing message
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Enhancing your image. Wait! 🗿\n◈━━━━━━━━━━━━━━━━◈`);

    try {
        // Step 1: Download the image buffer
        const media = await m.quoted.download();

        // Step 2: Check file size (limit to 10MB)
        if (media.length > 10 * 1024 * 1024) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Media is too large. Maximum size is 10MB.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        // Step 3: Upload image to get a public URL
        const uploadResult = await uploadImage(media);
        const imageUrl = uploadResult.url;

        // Step 4: Call the upscale API with the image URL
        const response = await axios.get("https://fgsi.koyeb.app/api/tools/upscale", {
            params: {
                apikey: "fgsiapi-2dcdfa06-6d",
                url: imageUrl,
            },
            headers: {
                accept: "application/json",
            },
            responseType: 'arraybuffer', // Expect binary image data
        });

        // Step 5: Handle the binary response
        const enhancedImage = Buffer.from(response.data);

        // Step 6: Send the enhanced image to the user
        await client.sendMessage(m.chat, {
            image: enhancedImage,
            caption: `◈━━━━━━━━━━━━━━━━◈\n❒ Image has been enhanced to HD.\n◈━━━━━━━━━━━━━━━━◈`,
        }, { quoted: m });

    } catch (err) {
        // Send error message with styling
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ An error occurred while processing the image: ${err.message}\n◈━━━━━━━━━━━━━━━━◈`);
    }
};