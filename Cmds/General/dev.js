module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact with a button to message them',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      const devPhoneNumber = '+254735342808'; // Developer's contact
      const waLink = `https://wa.me/${devPhoneNumber.replace('+', '')}?text=Yo,%20Toxic%20Dev!`;

      const contactText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Want to reach the ${botname} developer?* 🖤\n\n`;
      contactText += `📩 *Tap the button below to message me!*\n`;
      contactText += `◈━━━━━━━━━━━━━━━━◈`;

      // Send button with direct WhatsApp link
      await(m.chat, {
        text: contactText,
        footer: `Powered by ${botname}`,
        buttons: [
          { buttonId: waLink, buttonText: { displayText: '📩 Message Me' }, type: 2, url: waLink }
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