const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact as a vCard',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      // Retrieve settings
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings.` }, { quoted: m });
        return;
      }

      const devContact = {
        phoneNumber: '+254735342808',
        firstName: 'Toxic',
        lastName: 'Dev'
      };

      // Send vCard contact
      await client.sendMessage(m.chat, {
        contacts: {
          displayName: `${devContact.firstName} ${devContact.lastName}`,
          contacts: [{
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${devContact.firstName} ${devContact.lastName}\nTEL;TYPE=CELL:${devContact.phoneNumber}\nEND:VCARD`
          }]
        }
      }, { quoted: m });

    } catch (error) {
      console.error('Error sending developer contact:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops! Something went wrong. Try again later.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};