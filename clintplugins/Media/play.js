module.exports = async (context) => {
  const { client, m, text } = context;
  const yts = require("yt-search");
  const fetch = require("node-fetch");

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
  };

  if (!text) {
    return m.reply(formatStylishReply("Yo, dumbass, give me a song name! 🎵 Don’t waste my time."));
  }

  if (text.length > 100) {
    return m.reply(formatStylishReply("What’s this essay, loser? Keep the song name short, max 100 chars."));
  }

  try {
    const { videos } = await yts(text);
    if (!videos || videos.length === 0) {
      throw new Error("No songs found, you got shit taste. 😕 Try something else.");
    }

    const song = videos[0];
    const apiKey = "gifted_api_se5dccy";
    const apiUrl = `https://api.giftedtech.web.id/api/download/dlmp3?apikey=${apiKey}&url=${encodeURIComponent(song.url)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Download server’s being a bitch. 🚫 Try again later.");
    }

    const data = await response.json();
    if (!data.success || !data.result?.download_url) {
      throw new Error("Couldn’t snag the audio, server’s useless. 😞 Pick another song.");
    }

    const songTitle = data.result.title || song.title;
    const artist = song.author?.name || "Unknown Artist";
    const views = song.views?.toLocaleString() || "Unknown";
    const duration = song.duration?.toString() || "Unknown";
    const uploaded = song.ago || "Unknown";
    const quality = data.result.quality || "128Kbps";
    const thumbnail = data.result.thumbnail || song.thumbnail || "";
    const videoUrl = song.url;

    await m.reply(formatStylishReply(`Grabbing *${songTitle}* for you, hold your damn horses! 🎧`));

    // Format song info for caption
    const caption = `◈━━━━━━━━━━━━━━━━◈\n` +
                   `│❒ *${songTitle}* for ${m.pushName}! Jam out, you legend! 🎶\n` +
                   `│🎤 *Artist*: ${artist}\n` +
                   `│👀 *Views*: ${views}\n` +
                   `│⏱ *Duration*: ${duration}\n` +
                   `│📅 *Uploaded*: ${uploaded}\n` +
                   `│🔊 *Quality*: ${quality}\n` +
                   (thumbnail ? `│🖼 *Thumbnail*: ${thumbnail}\n` : '') +
                   `│🔗 *Video*: ${videoUrl}\n` +
                   `◈━━━━━━━━━━━━━━━━◈\n` +
                   `Powered by Toxic-MD`;

    await client.sendMessage(m.chat, {
      audio: { url: data.result.download_url },
      mimetype: "audio/mpeg",
      fileName: `${songTitle}.mp3`,
      caption: caption
    }, { quoted: m });

  } catch (error) {
    console.error("Error in play command:", error);
    return m.reply(formatStylishReply(`Shit went wrong: ${error.message} 😢 Got another song, or you giving up?`));
  }
};