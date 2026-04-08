module.exports = async (context) => {
        const { client, m, botname, text } = context;


const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

const axios = require("axios");
if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ EMIX ≪───\n├ \n├ No emojis provided?\n├ Are you braindead?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧')


  const emojis = text.split('+');

  if (emojis.length !== 2) {
    m.reply('╭───(    TOXIC-MD    )───\n├───≫ EMIX ≪───\n├ \n├ Specify the emojis and separate\n├ with \'+\', you dense fool.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    return;
  }

  const emoji1 = emojis[0].trim();
  const emoji2 = emojis[1].trim();

  try {
    const axios = require('axios');
    const response = await axios.get(`https://levanter.onrender.com/emix?q=${emoji1}${emoji2}`);

    if (response.data.status === true) {
    

      let stickerMess = new Sticker(response.data.result, {
        pack: botname,
        type: StickerTypes.CROPPED,
        categories: ["🤩", "🎉"],
        id: "12345",
        quality: 70,
        background: "transparent",
      });
      const stickerBuffer2 = await stickerMess.toBuffer();
      client.sendMessage(m.chat, { sticker: stickerBuffer2 }, { quoted: m });

    } else {
      m.reply('╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Unable to create emoji mix.\n├ Your emoji combo is trash.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }
  } catch (error) {
    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ An error occurred while creating\n├ the emoji mix.\n├ ${error}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }


}