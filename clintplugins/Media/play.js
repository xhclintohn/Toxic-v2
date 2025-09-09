const fs = require("fs");
const path = require("path");
const axios = require("axios");
const yts = require("yt-search");

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

    // Search for the video using yt-search
    const searchResults = await yts(text);
    const video = searchResults.videos[0];
    if (!video || !video.url) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("No tunes found, bruh! 😕 Try another search!") },
        { quoted: m, ad: true }
      );
    }

    const downloadUrl = `https://api.giftedtech.co.ke/api/download/ytmp3?apikey=gifted&url=${encodeURIComponent(video.url)}`;
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
    
    // Determine file extension based on download_url
    const fileExt = videoData.download_url.includes(".m4a") ? "m4a" : "mp3";
    const fileName = `audio_${timestamp}.${fileExt}`;
    const filePath = path.join(tempDir, fileName);

    // Download the audio file
    const downloadResponse = await axios({
      method: "get",
      url: videoData.download_url,
      responseType: "stream",
      timeout: 600000,
      headers: {
        "Accept": "audio/*",
      },
    });

    const writer = fs.createWriteStream(filePath);
    downloadResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", () => {
        // Verify file size after download
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
          resolve();
        } else {
          reject(new Error("Downloaded file is empty or invalid"));
        }
      });
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

    // Send the audio with the correct mimetype
    await client.sendMessage(
      m.chat,
      {
        audio: { url: filePath },
        mimetype: fileExt === "m4a" ? "audio/mp4" : "audio/mpeg",
        fileName: `${videoData.title}.${fileExt}`,
        contextInfo: {
          externalAdReply: {
            title: videoData.title,
            body: `${video.author?.name || "Unknown Artist"} | Powered by Toxic-MD`,
            thumbnailUrl: videoData.thumbnail || video.thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: video.url,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m, ad: true }
    );

    // Clean up the file
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