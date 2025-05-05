const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact with a button to message them',
  run: async (context) => {
    const { client, m, pict, botname } = context;

    try {
      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings.` }, { quoted: m });
        return;
      }

      const waLink = `https://wa.me/254735342808?text=Yo,%20Toxic%20Dev!`;

      let contactText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Want to reach the ${botname} developer?* 🖤\n\n`;
      contactText += `📩 *Tap the button below to message me!* 😈\n`;
      contactText += `◈━━━━━━━━━━━━━━━━◈`;

      // Send button with direct WhatsApp link
      await client.sendMessage(m.chat, {
        text: contactText,
        footer: `Powered by ${botname}`,
        buttons: [
          { buttonId: 'contact_dev', buttonText: { displayText: '📩 Contact Me' }, type: 2, url: waLink }
        ],
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