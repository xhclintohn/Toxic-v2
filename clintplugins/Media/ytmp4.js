const fs = require("fs");
const path = require("path");
const axios = require("axios");

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const isValidYouTubeUrl = (url) => {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/)?[A-Za-z0-9_-]{11}(\?.*)?$/.test(url);
};

module.exports = async (context) => {
  const { client, m, text } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
  };

  if (!text || !isValidYouTubeUrl(text)) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, drop a valid YouTube URL, fam! 📹 Ex: .ytmp4 https://youtu.be/60ItHLz5WEA") },
      { quoted: m, ad: true }
    );
  }

  try {
    const timestamp = Date.now();
    const fileName = `video_${timestamp}.mp4`;
    const filePath = path.join(tempDir, fileName);

    const thumbnailUrl = `https://i.ytimg.com/vi/${text.match(/[?&]v=([^&]+)/)?.[1]}/hqdefault.jpg` || "https://via.placeholder.com/120x90";

    await client.sendMessage(
      m.chat,
      { text: formatStylishReply("Snaggin’ the video for ya, fam! Hold tight! 🔥📽️") },
      { quoted: m, ad: true }
    );

    const apiUrl = `https://ytdownloader-aie4qa.fly.dev/download/video?song=${encodeURIComponent(text)}&quality=360p&cb=${timestamp}`;
    const response = await axios({
      method: "get",
      url: apiUrl,
      responseType: "stream",
      timeout: 600000,
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error("Video download failed or file is empty");
    }

    await client.sendMessage(
      m.chat,
      {
        video: { url: filePath },
        mimetype: "video/mp4",
        fileName: `video.mp4`,
        caption: formatStylishReply("Video (360p)"),
        contextInfo: {
          externalAdReply: {
            title: "YouTube Video",
            body: "Quality: 360p | Powered by Toxic-MD",
            thumbnailUrl,
            sourceUrl: text,
            mediaType: 2,
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
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Check the URL and try again! 😎`) },
      { quoted: m, ad: true }
    );
  }
};