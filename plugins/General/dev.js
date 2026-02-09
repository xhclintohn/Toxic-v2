const { botname } = require('../../config/settings');

module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact', 'owner', 'creator', 'devcontact'],
  description: 'Sends the developer contact as a vCard',
  run: async (context) => {
    const { client, m } = context;
    const bName = botname || 'Toxic-MD';

    try {
      const devContact = {
        phoneNumber: '254735342808',
        fullName: 'xh_clinton | Toxic Dev',
        org: 'Toxic-MD Bot'
      };

      const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${devContact.fullName}\nORG:${devContact.org};\nTEL;type=CELL;type=VOICE;waid=${devContact.phoneNumber}:+${devContact.phoneNumber}\nEND:VCARD`;

      await client.sendMessage(m.chat, {
        text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Cᴏɴᴛᴀᴄᴛ Cᴀʀᴅ ≪───\n々 Developer: ${devContact.fullName}\n々 Don't spam the dev or you'll\n々 regret your existence.\n々 Contact card sent below.\n╭───( ✓ )───`
      }, { quoted: m });

      await client.sendMessage(m.chat, {
        contacts: {
          displayName: devContact.fullName,
          contacts: [{ vcard }]
        }
      }, { quoted: m });

    } catch (error) {
      await client.sendMessage(m.chat, {
        text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 Couldn't send contact card.\n々 Error: ${error.message}\n╭───( ✓ )───`
      }, { quoted: m });
    }
  }
};
