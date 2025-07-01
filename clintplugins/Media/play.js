module.exports = async (context) => {
  const { client, m, text } = context;
  const axios = require("axios");
  const yts = require("yt-search");

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
  };

  // Check if query is provided
  if (!text) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, drop a song name, fam! 🎵 Ex: .play Only We Know Speed Up") },
      { quoted: m, ad: true }
    );
  }

  // Limit query length to keep it chill
  if (text.length > 100) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Keep it short, homie! Song name max 100 chars. 📝") },
      { quoted: m, ad: true }
    );
  }

  try {
    // Search for the banger
    const searchResult = await yts(text);
    const video = searchResult.videos[0];
    if (!video) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("No tunes found, bruh. 😕 Try another search!") },
        { quoted: m, ad: true }
      );
    }

    // Hit the API for that audio
    const { data } = await axios.get("https://api.yogik.id/downloader/youtube", {
      params: { url: video.url, format: "audio" },
      headers: { Accept: "application/json" },
    });

    const result = data.result;
    if (!result || !result.download_url) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("API’s ghosting us! 😢 Can’t grab the audio.") },
        { quoted: m, ad: true }
      );
    }

    // Send the audio with that dope preview
    await client.sendMessage(
      m.chat,
      {
        audio: { url: result.download_url },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${result.title || video.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: result.title || video.title,
            body: result.author_name || video.author.name || "Unknown Artist",
            thumbnailUrl: result.thumbnail_url || video.thumbnail,
            sourceUrl: video.url,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m, ad: true }
    );

    // Let 'em know it’s ready
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Droppin’ *${result.title || video.title}* for ya! Crank it up! 🔥🎧`) },
      { quoted: m, ad: true }
    );
  } catch (error) {
    console.error("Play command error:", error);
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another track! 😎`) },
      { quoted: m, ad: true }
    );
  }
};