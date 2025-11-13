const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = async (context) => {
  const { client, m, text } = context;

  try {
    // Ensure the user quoted an image and added a prompt
    if (!m.quoted) return m.reply("📸 Quote an image you want to edit!");
    if (!text) return m.reply("📝 Please provide your edit prompt — e.g. `.imgedit add a neon glow`");

    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || "";

    if (!mime.startsWith("image/")) {
      return m.reply("⚠️ Please quote or send a valid image file.");
    }

    // Download the quoted image
    const mediaBuffer = await q.download();

    // Save temporarily
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    // Upload to qu.ax
    const form = new FormData();
    form.append("files[]", fs.createReadStream(tempFilePath));

    const uploadResponse = await axios.post("https://qu.ax/upload.php", form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // Remove temp file
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    // Get uploaded image link
    const uploaded = uploadResponse.data?.files?.[0]?.url;
    if (!uploaded) return m.reply("❌ Failed to upload image.");

    await m.reply("🎨 Editing your image, please wait...");

    // Build the API URL
    const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(uploaded)}&prompt=${encodeURIComponent(text)}`;

    // Fetch edited image
    const editResponse = await axios.get(apiUrl, { responseType: "arraybuffer" });

    // Send the edited image
    await client.sendMessage(
      m.chat,
      {
        image: Buffer.from(editResponse.data),
        caption: `🧠 *Image Edited Successfully!*\n🎯 Prompt: ${text}\n\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("Image edit command error:", error);
    await m.reply(`❌ Failed to edit image: ${error.message}`);
  }
};