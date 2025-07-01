module.exports = async (context) => {
  const { client, m, text } = context;
  const axios = require("axios");
  const yts = require("yt-search");

  const formatStylishReply = (message) => {
    return `🎵 *Music Bot* 🎵\n${message}\n🎵 *Powered by Toxic-MD* 🎵`;
  };

  // Check if query is provided
  if (!text) {
    return m.reply(formatStylishReply("Yo, give me a song name! 🎧 Example: .play Only We Know Speed Up"));
  }

  // Limit query length to avoid abuse
  if (text.length > 100) {
    return m.reply(formatStylishReply("Keep the song name short, max 100 chars! 📝"));
  }

  try {
    // Search for the song
    const searchResult = await yts(text);
    const video = searchResult.videos[0];
    if (!video) {
      return m.reply(formatStylishReply("No songs found. Try a different search! 😕"));
    }

    // Fetch audio from API
    const { data } = await axios.get("https://api.yogik.id/downloader/youtube", {
      params: { url: video.url, format: "audio" },
      headers: { Accept: "application/json" },
    });

    const result = data.result;
    if (!result || !result.download_url) {
      return m.reply(formatStylishReply("Couldn’t get the audio. API’s acting up! 😢"));
    }

    // Send audio with metadata
    await client.sendMessage(
      m.chat,
      {
        audio: { url: result.download_url },
        mimetype: "audio/mpeg",
        ptt: false,
        fileName: `${result.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: result.title || video.title,
            body: result.author_name || video.author.name,
            thumbnailUrl: result.thumbnail_url || video.thumbnail,
            sourceUrl: video.url,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m }
    );

    // Notify user
    await m.reply(formatStylishReply(`Playing *${result.title || video.title}*! Enjoy! 🎶`));
  } catch (error) {
    console.error("Error in play command:", error);
    return m.reply(formatStylishReply(`Something broke: ${error.message}. Try another song! 😢`));
  }
};