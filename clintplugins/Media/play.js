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

  const fakeQuoted = {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: '0@s.whatsapp.net',
      id: m.id
    },
    message: {
      conversation: "Toxic Verified By WhatsApp"
    },
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true
    }
  };

  if (!text) {
    return m.reply(formatStylishReply("Yo, drop a song name, fam! 🎵 Ex: .play Not Like Us"));
  }

  if (text.length > 100) {
    return m.reply(formatStylishReply("Keep it short, homie! Song name max 100 chars. 📝"));
  }

  try {
    const searchQuery = `${text} official`;
    const searchResult = await yts(searchQuery);
    const video = searchResult.videos[0];
    if (!video) {
      return m.reply(formatStylishReply("No tunes found, bruh! 😕 Try another search!"));
    }

    const apiUrl = `https://api.fikmydomainsz.xyz/download/ytmp3?url=${encodeURIComponent(video.url)}`;

    // Call the API
    const response = await axios.get(apiUrl);
    const apiData = response.data;

    // Check if the API call was successful
    if (!apiData.status || !apiData.result) {
      throw new Error("API failed to process the video");
    }

    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // Download the audio file from the API's download URL
    const audioResponse = await axios({
      method: "get",
      url: apiData.result,
      responseType: "stream",
      timeout: 600000,
    });

    const writer = fs.createWriteStream(filePath);
    audioResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error("Download failed or file is empty");
    }

    await m.reply(formatStylishReply(`Droppin' *${apiData.result.title || video.title}* for ya, fam! Crank it up! 🔥🎧`));

    await client.sendMessage(
      m.chat,
      {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        fileName: `${(apiData.result.title || video.title).substring(0, 100)}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: apiData.result.title || video.title,
            body: `${video.author.name || "Unknown Artist"} | Powered by Toxic-MD`,
            thumbnailUrl: apiData.result.thumbnail || video.thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: video.url,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: fakeQuoted }
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    await m.reply(formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another track! 😎`));
  }
};