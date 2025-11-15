const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text } = context;

  if (!text) {
    return m.reply("Please provide a song name. Example: .lyrics Into your arms ft ava max");
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.deline.web.id/tools/lyrics?title=${encodedText}`;  // Fixed: Removed extra '='
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Check if API returned valid results (fixed: use 'status' and 'result')
    if (!data.status || !data.result || data.result.length === 0) {
      return m.reply(`No lyrics found for "${text}"`);
    }

    // Pick the result with the longest plainLyrics (handles multiples better)
    const song = data.result.reduce((best, current) => {
      return (current.plainLyrics?.length || 0) > (best.plainLyrics?.length || 0) ? current : best;
    }, data.result[0]);

    const { plainLyrics, artistName, name } = song;
    const cleanLyrics = plainLyrics || "No lyrics available";

    // Send lyrics with a simple header (remove if you want ONLY lyrics)
    const header = `Lyrics for "${name}" by ${artistName}:\n\n`;
    await m.reply(header + cleanLyrics);

  } catch (error) {
    console.error(`Lyrics API error: ${error.message}`);  // Fixed: Use message for cleaner log
    await m.reply(`Couldn't get lyrics for "${text}". Try again later.`);
  }
};