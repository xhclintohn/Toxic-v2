const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text } = context;

  if (!text) {
    return m.reply("Please provide a song name. Example: .lyrics Into your arms ft ava max");
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://www.varshade.biz.id/api/search/lyrics?query=${encodedText}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Check if API returned valid results
    if (!data.success || !data.results || data.results.length === 0) {
      return m.reply(`No lyrics found for "${text}"`);
    }

    // Get the first result
    const song = data.results[0];
    const { plainLyrics } = song;

    // Use plain lyrics (clean version without timestamps)
    const cleanLyrics = plainLyrics || "No lyrics available";

    // Send ONLY the lyrics, nothing else
    await m.reply(cleanLyrics);

  } catch (error) {
    console.error(`Lyrics API error: ${error.stack}`);
    await m.reply(`Couldn't get lyrics for "${text}". Try again later.`);
  }
};