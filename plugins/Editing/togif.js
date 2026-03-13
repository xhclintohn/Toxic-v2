const axios = require("axios");

module.exports = async (context) => {
  const { client, m, text } = context;

  try {
    if (!text) {
      return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO GIF ≪───\n├ \n├ Please provide an emoji to animate!\n├ Example: .togif 😂\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    if (!/\p{Emoji}/u.test(text)) {
      return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO GIF ≪───\n├ \n├ That doesn\'t look like an emoji.\n├ Try again with a real one, idiot!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    await m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO GIF ≪───\n├ \n├ Generating your animated emoji...\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

    const apiUrl = `https://api-faa.my.id/faa/emojigerak?emoji=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    await client.sendMessage(
      m.chat,
      {
        video: Buffer.from(response.data),
        gifPlayback: true,
        caption: `╭───(    TOXIC-MD    )───\n├───≫ ANIMATED EMOJI ≪───\n├ \n├ Animated Emoji: ${text}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("togif command error:", error);
    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to create emoji GIF:\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};