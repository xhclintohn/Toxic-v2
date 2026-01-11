const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text } = context;

  if (!text) {
    return m.reply("TELL ME A SONG YOU DUMBASS 🤦🏻 EXAMPLE: .lyrics Alone ft ava max");
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.nekolabs.web.id/discovery/lyrics/search?q=${encodedText}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.success || !data.result || data.result.length === 0) {
      return m.reply(`NO LYRICS FOUND FOR "${text}" 🤡 MAYBE THE SONG SUCKS`);
    }

    const song = data.result[0];

    if (!song.plainLyrics) {
      return m.reply(`NO PLAIN LYRICS FOR THIS ONE 🤦🏻 TRY ANOTHER SONG`);
    }

    const cleanLyrics = song.plainLyrics;
    const songTitle = song.trackName || song.name;
    const artistName = song.artistName;

    await m.reply(`*${songTitle} - ${artistName}*\n\n${cleanLyrics}\n\n> Tσxιƈ-ɱԃȥ`);

  } catch (error) {
    console.error(`LYRICS API ERROR: ${error.message}`);
    await m.reply(`CANT GET LYRICS FOR "${text}" SHIT BROKE 🤦🏻`);
  }
};