module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact in a normal vCard format',
  run: async (context) => {
    const { client, m } = context;

    try {
      const devContact = {
        phoneNumber: '254735342808',
        fullName: 'Toxic Dev'
      };

      // Ensure the vCard is structured properly
      const vCard = `BEGIN:VCARD\nVERSION:3.0\nFN:${devContact.fullName}\nTEL;TYPE=VOICE,MSG,SMS:${devContact.phoneNumber}\nEND:VCARD`;

      await client.sendMessage(m.chat, {
        contacts: {
          displayName: devContact.fullName,
          contacts: [{ vcard: vCard }]
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