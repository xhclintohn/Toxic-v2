const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text, pict, botname } = context;

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
    const apiUrl = `https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted&query=${encodedText}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.success || !data.result) {
      return m.reply(
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❒ ERROR\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
        "│ ❌ No lyrics found for \"" + text + "\", " + (m.pushName || "User") + ". Try a real song!\n" +
        "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈"
      );
    }

    // Clean up lyrics: remove colons, excessive newlines, and trim
    const lyrics = data.result
      .replace(/:\n/g, '') // Remove ":"
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single
      .trim();

    const caption =
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ LYRICS SEARCH\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ 🎵 Title: " + text + "\n" +
      "│ 🎤 Artist: Unknown (API's too lazy to tell)\n" +
      "│ 📜 Lyrics:\n" +
      lyrics + "\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\n" +
      "│ ❒ Powered by " + botname + ", 'cause " + (m.pushName || "User") + "'s too clueless to find lyrics\n" +
      "◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈";

    await client.sendMessage(
      m.chat,
      {
        image: { url: pict },
        caption: caption
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