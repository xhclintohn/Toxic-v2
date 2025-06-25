const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text, pict, botname } = context;

  // Error handling for missing botname/image
  if (!botname) {
    console.error(`Botname not set.`);
    return m.reply(
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ ERROR\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❌ Bot's broken. No botname in context. Yell at your dev!\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
    );
  }

  if (!pict) {
    console.error(`Pict not set.`);
    return m.reply(
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ ERROR\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❌ No image to send. Fix your context, genius!\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
    );
  }

  if (!text) {
    return m.reply(
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ ERROR\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ 🚫 Yo, " + (m.pushName || "User") + ", you forgot the song! Example: .lyrics Spectre\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
    );
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://lyricsapi.fly.dev/api/lyrics?q=${encodedText}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Check if API returned valid lyrics
    if (!data.success || !data.result?.lyrics) {
      return m.reply(
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❒ ERROR\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❌ No lyrics found for \"" + text + "\", " + (m.pushName || "User") + ". Try a real song!\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
      );
    }

    // Extract song details
    const { title, artist, lyrics, image } = data.result;

    // Clean up lyrics (remove colons, excessive newlines)
    const cleanedLyrics = lyrics
      .replace(/:\n/g, '') 
      .replace(/\n\s*\n/g, '\n') 
      .trim();

    // Format caption with song details
    const caption =
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ LYRICS SEARCH\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      `│ 🎵 Title: ${title}\n` +
      `│ 🎤 Artist: ${artist || "Unknown"}\n` +
      "│ 📜 Lyrics:\n" +
      cleanedLyrics + "\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      `│ ❒ Powered by ${botname}\n` +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈";

    // Send lyrics + cover art
    await client.sendMessage(
      m.chat,
      {
        image: { url: image || pict }, // Use API image if available
        caption: caption,
      },
      { quoted: m }
    );

  } catch (error) {
    console.error(`Lyrics API error: ${error.stack}`);
    await m.reply(
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ ERROR\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❌ Couldn't get lyrics for \"" + text + "\", " + (m.pushName || "User") + ". API's trash or you're cursed. Try later.\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
    );
  }
};