const axios = require("axios");

module.exports = async (context) => {
  const { client, m, text } = context;

  try {
    const query = text || "Toxic-MD";
    const apiUrl = `https://api.zenzxz.my.id/api/maker/animegirl/image?text=${encodeURIComponent(query)}`;

    await m.reply("🎨 Generating your anime girl image...");

    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    // Send the image to chat
    await client.sendMessage(
      m.chat,
      {
        image: Buffer.from(response.data),
        caption: `✨ Anime Girl Generated for *${query}* ✨\n\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("AnimeGirl command error:", error);
    await m.reply(`❌ Failed to generate image: ${error.message}`);
  }
};