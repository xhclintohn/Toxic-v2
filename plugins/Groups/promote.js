const middleware = require('../../utils/botUtil/middleware');
const { botname } = require('../../config/settings');

module.exports = {
  name: 'promote',
  aliases: ['makeadmin', 'addadmin', 'promoteuser'],
  description: 'Promotes a user to admin in a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix } = context;
      const bName = botname || 'Toxic-MD';

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Mention or quote a user.\n├ Example: ${prefix}promote @user\n├ Do I have to spell everything?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      let users = m.mentionedJid ? m.mentionedJid[0] : null;
      if (!users && m.quoted) {
        users = m.quoted.sender;
      }
      
      if (!users) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ INVALID ≪───\n├ \n├ Invalid user specified.\n├ Tag someone properly, fool.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const parts = users.split('@')[0];

      try {
        await client.groupParticipantsUpdate(m.chat, [users], 'promote');
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PROMOTED ≪───\n├ \n├ @${parts} is now an admin.\n├ Don't let the power go to\n├ your empty head.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, {
          mentions: [users]
        });
      } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SUCCESS ≪───\n├ \n├ User promoted successfully.\n├ Now they can be useless\n├ with admin powers too.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
    });
  }
};
