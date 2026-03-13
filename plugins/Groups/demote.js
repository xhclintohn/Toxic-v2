const middleware = require('../../utils/botUtil/middleware');
const { botname } = require('../../config/settings');

module.exports = {
  name: 'demote',
  aliases: ['unadmin', 'removeadmin', 'deadmin', 'demoteuser'],
  description: 'Demotes a user from admin in a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, prefix, isBotAdmin } = context;
      const bName = botname || 'Toxic-MD';

      if (!isBotAdmin) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ NOT ADMIN ≪───\n├ \n├ I'm not admin here, fool.\n├ Make me admin first, then\n├ come crawling back.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Mention or quote a user.\n├ Example: ${prefix}demote @user\n├ Don't waste my time.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      let user = m.mentionedJid ? m.mentionedJid[0] : null;
      if (!user && m.quoted) {
        user = m.quoted.sender;
      }
      
      if (!user) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ INVALID ≪───\n├ \n├ Invalid user specified.\n├ Tag someone properly.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const userNumber = user.split('@')[0];

      try {
        const groupMetadata = await client.groupMetadata(m.chat);
        const members = groupMetadata.participants || [];
        
        const targetAdmin = members.find(p => {
          const pJid = p.jid || p.id;
          return pJid === user && p.admin !== null;
        });
        
        if (!targetAdmin) {
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ NOT ADMIN ≪───\n├ \n├ @${userNumber} isn't even admin.\n├ Can't demote a peasant.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, {
            mentions: [user]
          });
        }

        await client.groupParticipantsUpdate(m.chat, [user], 'demote');
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ DEMOTED ≪───\n├ \n├ @${userNumber} got stripped of admin.\n├ Back to being a nobody.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, {
          mentions: [user]
        });
      } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SUCCESS ≪───\n├ \n├ User demoted successfully.\n├ Enjoy being powerless again.\n├ Serves you right.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
    });
  },
};
