const middleware = require('../../utils/botUtil/middleware');
const { botname } = require('../../config/settings');

module.exports = {
  name: 'remove',
  aliases: ['kick', 'yeet', 'boot', 'removemember'],
  description: 'Removes a user from a group',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, botNumber, prefix } = context;
      const bName = botname || 'Toxic-MD';

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ USAGE ≪───\n├ \n├ Mention or quote a user.\n├ Example: ${prefix}kick @user\n├ Don't make me guess, idiot.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const users = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!users) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ INVALID ≪───\n├ \n├ No valid user found.\n├ Tag or quote someone.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      if (typeof users !== 'string' || (!users.includes('@s.whatsapp.net') && !users.includes('@lid'))) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ INVALID ≪───\n├ \n├ Invalid user format.\n├ Tag a valid user.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const parts = users.split('@')[0];

      const botJid = await client.decodeJid(client.user.id);
      if (users === botNumber || users === botJid || users.split('@')[0] === botJid.split('@')[0]) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ NICE TRY ≪───\n├ \n├ You can't kick me, loser.\n├ I'm the boss here.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      try {
        await client.groupParticipantsUpdate(m.chat, [users], 'remove');
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ KICKED ≪───\n├ \n├ @${parts} got yeeted out.\n├ Good riddance, trash.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, m.chat, {
          mentions: [users]
        });
      } catch (error) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Couldn't kick @${parts}.\n├ Am I even admin here?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`, m.chat, {
          mentions: [users]
        });
      }
    });
  }
};
