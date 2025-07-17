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
      { text: formatStylishReply("Yo, drop a valid YouTube URL, fam! 📹 Ex: .youtube https://youtu.be/60ItHLz5WEA") },
      { quoted: m, ad: true }
    );
  }

  try {
    const timestamp = Date.now();
    const audioFileName = `audio_${timestamp}.mp3`;
    const videoFileName = `video_${timestamp}.mp4`;
    const audioFilePath = path.join(tempDir, audioFileName);
    const videoFilePath = path.join(tempDir, videoFileName);

    const thumbnailUrl = `https://i.ytimg.com/vi/${text.match(/[?&]v=([^&]+)/)?.[1]}/hqdefault.jpg` || "https://via.placeholder.com/120x90";

    await client.sendMessage(
      m.chat,
      { text: formatStylishReply("Grabbin’ audio and video for ya, fam! Hold tight! 🔥🎶📽️") },
      { quoted: m, ad: true }
    );

    // Download audio
    const audioApiUrl = `https://ytdownloader-aie4qa.fly.dev/download/audio?song=${encodeURIComponent(text)}&quality=128K&cb=${timestamp}`;
    let response = await axios({
      method: "get",
      url: audioApiUrl,
      responseType: "stream",
      timeout: 600000,
    });

    let writer = fs.createWriteStream(audioFilePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(audioFilePath) || fs.statSync(audioFilePath).size === 0) {
      throw new Error("Audio download failed or file is empty");
    }

    // Send audio
    await client.sendMessage(
      m.chat,
      {
        audio: { url: audioFilePath },
        mimetype: "audio/mpeg",
        fileName: `song.mp3`,
        contextInfo: {
          externalAdReply: {
            title: "YouTube Audio",
            body: "Quality: 128K | Powered by Toxic-MD",
            thumbnailUrl,
            sourceUrl: text,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m, ad: true }
    );

    // Clean up audio
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }

    // Download video
    const videoApiUrl = `https://ytdownloader-aie4qa.fly.dev/download/video?song=${encodeURIComponent(text)}&quality=360p&cb=${timestamp}`;
    response = await axios({
      method: "get",
      url: videoApiUrl,
      responseType: "stream",
      timeout: 600000,
    });

    writer = fs.createWriteStream(videoFilePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(videoFilePath) || fs.statSync(videoFilePath).size === 0) {
      throw new Error("Video download failed or file is empty");
    }

    // Send video
    await client.sendMessage(
      m.chat,
      {
        video: { url: videoFilePath },
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

    // Clean up video
    if (fs.existsSync(videoFilePath)) {
      fs.unlinkSync(videoFilePath);
    }
  } catch (error) {
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Check the URL and try again! 😎`) },
      { quoted: m, ad: true }
    );
  }
};