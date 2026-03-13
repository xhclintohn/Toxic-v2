const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args } = context;

    try {
      const settings = await getSettings();
      const prefix = settings.prefix || '.';
      const newEmoji = args[0];
      const currentEmoji = settings.autolikeemoji || 'random';

      if (newEmoji) {
        if (newEmoji === 'random') {
          if (currentEmoji === 'random') {
            await m.reply("╭───(    TOXIC-MD    )───\n├ Already using random emojis, you brain-dead fool!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
            return;
          }
          await updateSetting('autolikeemoji', 'random');
          await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
          await m.reply("╭───(    TOXIC-MD    )───\n├ Reaction emoji set to random! Happy now?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        } else {
          if (currentEmoji === newEmoji) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Already using ${newEmoji} emoji, moron!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            return;
          }
          await updateSetting('autolikeemoji', newEmoji);
          await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
          await m.reply(`╭───(    TOXIC-MD    )───\n├ Reaction emoji set to ${newEmoji}!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
        return;
      }

      const currentText = currentEmoji === 'random' ? 'Random emojis' : `${currentEmoji} emoji`;

      await client.sendMessage(m.chat, {
        interactiveMessage: {
          header: `╭───(    TOXIC-MD    )───\n├───≫ REACTION SETTINGS ≪───\n├ \n├ Current: ${currentText}\n├ \n├ Use "${prefix}reaction random" for random\n├ Use "${prefix}reaction <emoji>" for specific\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "RANDOM",
                id: `${prefix}reaction random`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "LOVE",
                id: `${prefix}reaction ❤️`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "FIRE",
                id: `${prefix}reaction 🔥`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "LAUGH",
                id: `${prefix}reaction 😂`
              })
            }
          ]
        }
      }, { quoted: m });

    } catch (error) {
      console.error('Reaction command error:', error);
      await m.reply("╭───(    TOXIC-MD    )───\n├ Failed to update reaction settings. Something's broken.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }
  });
};
