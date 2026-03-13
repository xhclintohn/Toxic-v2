const fetch = require('node-fetch');

module.exports = async (context) => {
  const { client, m, text } = context;

  if (!text) {
    return m.reply("╭───(    TOXIC-MD    )───\n├ Tell me a song name you dumbass!\n├ Example: .lyrics Alone ft ava max\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
  }

  try {
    const encodedText = encodeURIComponent(text);
    const apiUrl = `https://api.deline.web.id/tools/lyrics?title=${encodedText}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.status || !data.result || data.result.length === 0) {
      return m.reply(`╭───(    TOXIC-MD    )───\n├ No lyrics found for "${text}". Maybe the song sucks.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    const song = data.result[0];

    if (!song.plainLyrics) {
      return m.reply("╭───(    TOXIC-MD    )───\n├ No plain lyrics for this one. Try another song, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }

    const cleanLyrics = song.plainLyrics;
    const songTitle = song.trackName || song.name;
    const artistName = song.artistName;

    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ LYRICS ≪───\n├ \n├ ${songTitle} - ${artistName}\n├ \n${cleanLyrics}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

  } catch (error) {
    console.error(`LYRICS API ERROR: ${error.message}`);
    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ LYRICS ERROR ≪───\n├ \n├ Can't get lyrics for "${text}". Shit broke.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};
