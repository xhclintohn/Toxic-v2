const fs = require("fs");
const path = require("path");
const axios = require("axios");

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

module.exports = async (context) => {
  const { client, m, text } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
  };

  // Check if the message is recent (within 1 second)
  const currentTime = Math.floor(Date.now() / 1000);
  const messageTime = m.date || Math.floor(Date.now() / 1000);
  if (currentTime - messageTime > 1) {
    return;
  }

  if (!text) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, drop a song name, fam! 🎵 Ex: .play Not Like Us") },
      { quoted: m, ad: true }
    );
  }

  if (text.length > 100) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Keep it short, homie! Song name max 100 chars. 📝") },
      { quoted: m, ad: true }
    );
  }

  try {
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply("🔍 Searchin’ for that track, hold up...") },
      { quoted: m, ad: true }
    );

    const apiUrl = `https://api.diioffc.web.id/api/search/ytplay?query=${encodeURIComponent(text)}`;
    const { data: response } = await axios.get(apiUrl);

    const video = response.result;
    if (!video || !video.url) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("No tunes found, bruh! 😕 Try another search!") },
        { quoted: m, ad: true }
      );
    }

    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // Assuming the API provides a direct audio download link; adjust if needed
    const downloadUrl = `https://api.diioffc.web.id/api/download/ytmp3?url=${encodeURIComponent(video.url)}&quality=128K&cb=${timestamp}`;
    const downloadResponse = await axios({
      method: "get",
      url: downloadUrl,
      responseType: "stream",
      timeout: 600000,
    });

    const writer = fs.createWriteStream(filePath);
    downloadResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error("Download failed or file is empty");
    }

    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Droppin’ *${video.title}* for ya, fam! Crank it up! 🔥🎧`) },
      { quoted: m, ad: true }
    );

    await client.sendMessage(
      m.chat,
      {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: `${video.author?.name || "Unknown Artist"} | Powered by Toxic-MD`,
            thumbnailUrl: video.thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: video.url,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m, ad: true }
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another track! 😎`) },
      { quoted: m, ad: true }
    );
  }
};