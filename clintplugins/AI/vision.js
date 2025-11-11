const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        // Ensure there is a quoted message and text prompt
        if (!m.quoted) return m.reply("📸 Quote an image or send one with your prompt.");
        if (!text) return m.reply("📝 Please add a caption or prompt — e.g. `what’s in this image?`");

        const q = m.quoted ? m.quoted : m;
        const mime = (q.msg || q).mimetype || '';

        if (!mime.startsWith('image/')) {
            return m.reply("⚠️ Please quote or send a valid image file.");
        }

        // Download image
        const mediaBuffer = await q.download();

        // Save media temporarily
        const tempFilePath = path.join(__dirname, `temp_${Date.now()}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        // Upload image to qu.ax
        const form = new FormData();
        form.append('files[]', fs.createReadStream(tempFilePath));

        const uploadResponse = await axios.post('https://qu.ax/upload.php', form, {
            headers: {
                ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        // Clean up file
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

        // Get uploaded image URL
        const uploaded = uploadResponse.data?.files?.[0]?.url;
        if (!uploaded) return m.reply("❌ Failed to upload image.");

        await m.reply("🧠 Analyzing image, please wait...");

        // Call GPTNano Vision API
        const apiUrl = `https://api.ootaizumi.web.id/ai/gptnano?prompt=${encodeURIComponent(text)}&imageUrl=${encodeURIComponent(uploaded)}`;
        const response = await axios.get(apiUrl);

        // Handle success
        if (response.data && response.data.result) {
            await client.sendMessage(m.chat, {
                text: `*Vision Analysis (Toxic-MD)* ⚠️\n\n${response.data.result}\n\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃ`,
            }, { quoted: m });
        } else {
            await m.reply("⚠️ Failed to interpret the response from the API.");
        }

    } catch (error) {
        console.error("Vision command error:", error);
        await m.reply(`❌ Error: ${error.message}`);
    }
};