const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args } = context;

    try {
      const settings = await getSettings();
      const prefix = settings.prefix || '.';
      const newEmoji = args[0];

      if (newEmoji) {
        if (newEmoji === 'random') {
          await updateSetting('autolikeemoji', 'random');
          await m.reply(`Random emoji mode ON! Statuses will get wild reactions!`);
          return;
        } else {
          await updateSetting('autolikeemoji', newEmoji);
          await m.reply(`Status react emoji set to ${newEmoji}! Flexing it like a king!`);
          return;
        }
      }

      const currentEmoji = settings.autolikeemoji || 'random';
      
      await client.sendMessage(m.chat, {
        interactiveMessage: {
          header: "🎭 Status Reaction Settings",
          body: {
            text: `Current: ${currentEmoji === 'random' ? '🎲 Random emojis' : currentEmoji}\n\nChoose how the bot reacts to statuses.`
          },
          footer: "Powered by Toxic-MD",
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🎲 RANDOM EMOJIS",
                id: `${prefix}reaction random`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "❤️ LOVE REACT",
                id: `${prefix}reaction ❤️`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🔥 FIRE REACT",
                id: `${prefix}reaction 🔥`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "😂 LAUGH REACT",
                id: `${prefix}reaction 😂`
              })
            }
          ]
        }
      }, { quoted: m });

    } catch (error) {
      console.error('Reaction command error:', error);
      await m.reply(`Failed to update reaction settings. Something's broken.`);
    }
  });
};