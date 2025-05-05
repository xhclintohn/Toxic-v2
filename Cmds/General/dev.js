const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact with a link to message them',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      // Retrieve settings
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings.` }, { quoted: m });
        return;
      }

      const waLink = `https://wa.me/254735342808?text=Yo,%20Toxic%20Dev!`;

      const contactText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Want to reach the ${botname} developer?* 🖤\n\n`;
      contactText += `📩 *Tap the link below to message me!*\n\n`;
      contactText += `🔗 ${waLink}\n`;
      contactText += `◈━━━━━━━━━━━━━━━━◈`;

      // Send message with clickable link
      await client.sendMessage(m.chat, {
        text: contactText,
        footer: `Powered by ${botname}`,
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

    } catch (error) {
      console.error('Error sending developer contact:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops! Something went wrong. Try again later.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};