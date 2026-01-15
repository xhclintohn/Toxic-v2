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
        // First turn autolike on if it's off
        if (settings.autolike === 'false') {
          await updateSetting('autolike', 'random');
        }
        
        await updateSetting('autolike', newEmoji);
        
        await m.reply(`Status reaction set to ${newEmoji}! Autolike is now ON with this emoji.`);
        return;
      }

      const currentValue = settings.autolike;
      const currentText = currentValue === 'false' ? '❌ OFF (Turn ON first)' : 
                         currentValue === 'random' ? '🎲 Random emojis' : 
                         `${currentValue} emoji`;

      await client.sendMessage(m.chat, {
        interactiveMessage: {
          header: `🎭 Status Reaction Settings\n\nCurrent: ${currentText}\n\n• Use "${prefix}reaction random" for random emojis\n• Use "${prefix}reaction <emoji>" for specific emoji\n• Autolike must be ON for reactions to work`,
          footer: "Powered by Toxic-MD",
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🎲 RANDOM",
                id: `${prefix}reaction random`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "❤️ LOVE",
                id: `${prefix}reaction ❤️`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🔥 FIRE",
                id: `${prefix}reaction 🔥`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "😂 LAUGH",
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