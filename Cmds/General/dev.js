module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact with a button to message them',
  run: async (context) => {
    const { client, m, pict, botname } = context;

    try {
      const devPhoneNumber = '+254735342808'; // Developer's contact
      const waLink = `https://wa.me/${devPhoneNumber.replace('+', '')}?text=Yo,%20Toxic%20Dev!`;

      const contactText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Meet the ${botname} Mastermind!* 💀\n\n`;
      contactText += `👤 *Name*: Toxic Dev\n`;
      contactText += `📩 *Message Me Directly Below!*\n`;
      contactText += `◈━━━━━━━━━━━━━━━━◈`;

      // Send button with direct WhatsApp link
      await client.sendMessage(m.chat, {
        text: contactText,
        footer: `TPσɯҽɾҽԃ Ⴆყ ${botname}`,
        buttons: [
          { buttonId: waLink, buttonText: { displayText: '📩 Contact Me' }, type: 1 }
        ],
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

    } catch (error) {
      console.error('Error sending developer contact:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something went wrong. Try again later!\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};