module.exports = {
  name: 'sticker',
  aliases: ['s', 'stick'],
  description: 'Fetches GIF stickers from Tenor with your search term',
  run: async (context) => {
    const { client, m, text, botname } = context;
    const axios = require('axios');
    const { Sticker, StickerTypes } = require('wa-sticker-formatter');

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`╭───(    TOXIC-MD    )───\nBot’s toast, no botname found! Yell at the dev, you legend.\nCheck https://github.com/xhclintohn/Toxic-MD\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`╭───(    TOXIC-MD    )───\nCan’t read your number, you beast! Try again.\nCheck https://github.com/xhclintohn/Toxic-MD\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const userNumber = m.sender.split('@')[0];

      // Check for search term
      if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\nGimme a search term, @${userNumber}! Don’t choke, you legend. 🖼️\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, { mentions: [m.sender] });
      }

      // Notify in groups
      if (m.isGroup) {
        await m.reply(`╭───(    TOXIC-MD    )───\nSpamming groups? I got you in DMs, @${userNumber}! 📥🔥\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, { mentions: [m.sender] });
      }

      const tenorApiKey = 'AIzaSyCyouca1_KKy4W_MG1xsPzuku5oa8W358c';

      // Fetch GIFs
      const gifResponse = await axios.get(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(text)}&key=${tenorApiKey}&client_key=my_project&limit=8&media_filter=gif`
      );

      const results = gifResponse.data.results;
      if (!results || results.length === 0) {
        return m.reply(`╭───(    TOXIC-MD    )───\nNo stickers found for "${text}", @${userNumber}! Try something else, you slacker. 😈\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, { mentions: [m.sender] });
      }

      // Send up to 8 stickers
      for (let i = 0; i < Math.min(8, results.length); i++) {
        const gifUrl = results[i].media_formats.gif.url;

        const stickerMess = new Sticker(gifUrl, {
          pack: botname,
          author: '𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
          type: StickerTypes.FULL,
          categories: ['🤩', '🎉'],
          id: `12345-${i}`,
          quality: 60,
          background: 'transparent'
        });

        const stickerBuffer = await stickerMess.toBuffer();
        await client.sendMessage(m.sender, { sticker: stickerBuffer }, { quoted: m });
      }

    } catch (error) {
      console.error(`Sticker command fucked up: ${error.stack}`);
      await m.reply(`╭───(    TOXIC-MD    )───\nSticker fetch failed, @${userNumber}! Something’s busted, try again. 😈\nCheck https://github.com/xhclintohn/Toxic-MD\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, { mentions: [m.sender] });
    }
  }
};