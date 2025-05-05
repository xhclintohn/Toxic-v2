module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact in vCard format',
  run: async (context) => {
    const { client, m } = context;

    try {
      const devContact = {
        phoneNumber: '+254735342808',
        fullName: 'Toxic Dev'
      };

      // Send vCard in proper contact format
      await client.sendMessage(m.chat, {
        contacts: {
          displayName: devContact.fullName,
          contacts: [{
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${devContact.fullName}\nTEL;TYPE=CELL:${devContact.phoneNumber}\nEND:VCARD`
          }]
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