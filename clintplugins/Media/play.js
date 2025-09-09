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
      { text: formatStylishReply("Yo, drop a song name or YouTube URL, fam! 🎵 Ex: .play Not Like Us") },
      { quoted: m, ad: true }
    );
  }

  if (text.length > 100) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Keep it short, homie! Song name or URL max 100 chars. 📝") },
      { quoted: m, ad: true }
    );
  }

  try {
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply("🔍 Searchin’ for that track, hold up...") },
      { quoted: m, ad: true }
    );

    let downloadUrl;
    let video;

    // Check if the input is a YouTube URL
    const isUrl = text.match(/(https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+)/);
    if (isUrl) {
      // If input is a URL, use it directly
      downloadUrl = `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(text)}`;
    } else {
      // If input is a search query, search for the video first (using YouTube search API or similar)
      const searchUrl = `https://api.giftedtech.co.ke/api/search/yts?query=${encodeURIComponent(text)}`;
      const searchResponse = await axios.get(searchUrl);
      video = searchResponse.data.result?.[0]; // Assuming the search API returns a list of results
      if (!video || !video.url) {
        return client.sendMessage(
          m.chat,
          { text: formatStylishReply("No tunes found, bruh! 😕 Try another search!") },
          { quoted: m, ad: true }
        );
      }
      downloadUrl = `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(video.url)}`;
    }

    const { data: response } = await axios.get(downloadUrl);
    if (!response.success || !response.result.download_url) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("Couldn’t grab that track, fam! 😕 Try another one!") },
        { quoted: m, ad: true }
      );
    }

    const videoData = response.result;
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // Download the audio file
    const downloadResponse = await axios({
      method: "get",
      url: videoData.download_url,
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
      { text: formatStylishReply(`Droppin’ *${videoData.title}* for ya, fam! Crank it up! 🔥🎧`) },
      { quoted: m, ad: true }
    );

    await client.sendMessage(
      m.chat,
      {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        fileName: `${videoData.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: videoData.title,
            body: `${videoData.author?.name || "Unknown Artist"} | Powered by Toxic-MD`,
            thumbnailUrl: videoData.thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: videoData.url || text,
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