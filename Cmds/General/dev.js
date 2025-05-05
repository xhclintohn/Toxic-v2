const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact as a vCard',
  run: async (context) => {
    const { client, m } = context;

    try {
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings.` }, { quoted: m });
        return;
      }

      
      const devContact = {
        phoneNumber: '254735342808',
        fullName: 'Toxic Dev'
      };

      const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${devContact.fullName}
TEL;waid=${devContact.phoneNumber}:${devContact.phoneNumber}
END:VCARD
`;

     
      await client.sendMessage(m.chat, {
        contacts: {
          displayName: devContact.fullName,
          contacts: [{ vcard }]
        }
      }, { quoted: m });

    } catch (error) {
      console.error('Error sending developer contact:', error);
      await client.sendMessage(m.chat, {
        text: `Oops! Something went wrong. Try again later.`
      }, { quoted: m });
    }
  }
};