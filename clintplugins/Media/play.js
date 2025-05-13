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
    const apiKey = "gifted";
    const apiUrl = `https://api.giftedtech.web.id/api/download/ytmp3?apikey=${apiKey}&url=${encodeURIComponent(song.url)}`;

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
    await m.reply(formatStylishReply(`Grabbing *${songTitle}* for you, hold your damn horses! 🎧`));

    await client.sendMessage(m.chat, {
      audio: { url: data.result.download_url },
      mimetype: "audio/mpeg",
      fileName: `${songTitle}.mp3`
    }, { quoted: m });

  } catch (error) {
    console.error("Error in play command:", error);
    return m.reply(formatStylishReply(`Shit went wrong: ${error.message} 😢 Got another song, or you giving up?`));
  }
};