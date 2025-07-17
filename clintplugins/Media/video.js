const fs = require("fs");
const path = require("path");
const yts = require("yt-search");
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

  if (!text) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, drop a video name, fam! 📹 Ex: .video Alone ft Ava Max") },
      { quoted: m, ad: true }
    );
  }

  if (text.length > 100) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Keep it short, homie! Video name max 100 chars. 📝") },
      { quoted: m, ad: true }
    );
  }

  try {
    const searchQuery = `${text} official`;
    const searchResult = await yts(searchQuery);
    const video = searchResult.videos[0];
    if (!video) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("No videos found, bruh! 😕 Try another search!") },
        { quoted: m, ad: true }
      );
    }

    const timestamp = Date.now();
    const fileName = `video_${timestamp}.mp4`;
    const filePath = path.join(tempDir, fileName);

    const apiUrl = `https://ytdownloader-aie4qa.fly.dev/download/video?song=${encodeURIComponent(video.url)}&quality=360p&cb=${timestamp}`;
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
      throw new Error("Download failed or file is empty");
    }

    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Droppin’ *${video.title}* video for ya, fam! Hold tight! 🔥📽️`) },
      { quoted: m, ad: true }
    );

    await client.sendMessage(
      m.chat,
      {
        video: { url: filePath },
        mimetype: "video/mp4",
        fileName: `${video.title}.mp4`,
        caption: formatStylishReply("Video (360p)"),
        contextInfo: {
          externalAdReply: {
            title: video.title,
            body: `${video.author.name || "Unknown Artist"} | Powered by Toxic-MD`,
            thumbnailUrl: video.thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: video.url,
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
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another video! 😎`) },
      { quoted: m, ad: true }
    );
  }
};