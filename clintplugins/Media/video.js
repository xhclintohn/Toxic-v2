const fs = require("fs");
const path = require("path");
const yts = require("yt-search");
const axios = require("axios");

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
    // 1. Search YouTube
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

    // 2. Call the API
    const apiUrl = `https://api.privatezia.biz.id/api/downloader/ytmp4?url=${encodeURIComponent(video.url)}`;
    const { data } = await axios.get(apiUrl);

    if (!data || !data.status || !data.result || !data.result.downloadUrl) {
      throw new Error("API returned invalid response.");
    }

    const result = data.result;

    // 3. Notify user
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Droppin’ *${result.title}* video for ya, fam! Hold tight! 🔥📽️`) },
      { quoted: m, ad: true }
    );

    // 4. Send video
    await client.sendMessage(
      m.chat,
      {
        video: { url: result.downloadUrl },
        mimetype: "video/mp4",
        fileName: `${result.title}.mp4`,
        caption: formatStylishReply(`🎬 ${result.title}\n📊 Quality: ${result.quality}\n⏳ Duration: ${result.duration}s`),
        contextInfo: {
          externalAdReply: {
            title: result.title,
            body: `Powered by Toxic-MD`,
            thumbnailUrl: result.thumbnail,
            sourceUrl: video.url,
            mediaType: 2,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m, ad: true }
    );
  } catch (error) {
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another video! 😎`) },
      { quoted: m, ad: true }
    );
  }
};