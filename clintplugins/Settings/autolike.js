const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args } = context;

    try {
      const settings = await getSettings();
      const prefix = settings.prefix || '.';
      const value = args[0]?.toLowerCase();
      const currentValue = settings.autolike;

      if (value === 'on' || value === 'off') {
        const newValue = value === 'on' ? 'random' : 'false';
        
        if (currentValue === newValue) {
          await m.reply(`Autolike is already ${currentValue === 'false' ? 'OFF' : 'ON'}, you brain-dead fool!`);
          return;
        }

        await updateSetting('autolike', newValue);
        
        await m.reply(`Autolike ${value.toUpperCase()}! ${value === 'on' ? 'Bot will now like statuses with random emojis!' : 'Bot will ignore statuses like they ignore you.'}`);
        return;
      }

      const statusText = currentValue === 'false' ? '❌ OFF - Ignoring statuses' : 
                        currentValue === 'random' ? '🎲 ON (Random emojis)' : 
                        `✅ ON (${currentValue} emoji)`;

      await client.sendMessage(m.chat, {
        interactiveMessage: {
          header: `🔧 Autolike Settings\n\nCurrent: ${statusText}\n\n• Use "${prefix}autolike on" to turn ON with random emojis\n• Use "${prefix}autolike off" to turn OFF\n• Use "${prefix}reaction <emoji>" to set specific emoji`,
          footer: "Powered by Toxic-MD",
          buttons: [
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🟢 TURN ON",
                id: `${prefix}autolike on`
              })
            },
            {
              name: "quick_reply",
              buttonParamsJson: JSON.stringify({
                display_text: "🔴 TURN OFF",
                id: `${prefix}autolike off`
              })
            }
          ]
        }
      }, { quoted: m });

    } catch (error) {
      console.error('Autolike command error:', error);
      await m.reply(`Failed to update autolike. Database might be drunk.`);
    }
  });
};