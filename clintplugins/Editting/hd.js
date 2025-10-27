const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Upload function extracted from the upload command
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

    if (!/image/.test(mime)) {
        return m.reply("Please send or reply to an image.");
    }

    try {
        // Step 1: Download the image buffer
        const media = await m.quoted.download();

        // Step 2: Check file size (limit to 10MB, as in upload command)
        if (media.length > 10 * 1024 * 1024) {
            return m.reply('Media is too large. Maximum size is 10MB.');
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
        });

        // Step 5: Handle the API response
        let enhancedImage;
        if (response.data && response.data.image_url) {
            // If API returns a JSON object with an image_url
            const imageResponse = await axios.get(response.data.image_url, {
                responseType: 'arraybuffer',
            });
            enhancedImage = Buffer.from(imageResponse.data);
        } else if (response.data instanceof Buffer) {
            // If API returns binary image data directly
            enhancedImage = Buffer.from(response.data);
        } else {
            throw new Error("Unexpected API response format. Expected image_url or binary data.");
        }

        // Step 6: Send the enhanced image to the user
        await client.sendMessage(m.chat, {
            image: enhancedImage,
            caption: 'Image has been enhanced to HD.',
        }, { quoted: m });

    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        m.reply(`An error occurred while processing the image: ${err.message}`);
    }
};