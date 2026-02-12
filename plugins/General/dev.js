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
        text: `╭───(    TOXIC-MD    )───\n├───≫ Cᴏɴᴛᴀᴄᴛ Cᴀʀᴅ ≪───\n├ \n├ Developer: ${devContact.fullName}\n├ Don't spam the dev or you'll\n├ regret your existence.\n├ Contact card sent below.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: m });

      await client.sendMessage(m.chat, {
        contacts: {
          displayName: devContact.fullName,
          contacts: [{ vcard }]
        }
      }, { quoted: m });

    } catch (error) {
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ Couldn't send contact card.\n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: m });
    }
  }
};
