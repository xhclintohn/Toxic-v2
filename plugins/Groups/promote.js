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
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Usᴀɢᴇ ≪───\n々 Mention or quote a user.\n々 Example: ${prefix}promote @user\n々 Do I have to spell everything?\n╭───( ✓ )───`);
      }

      const users = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!users) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Iɴᴠᴀʟɪᴅ ≪───\n々 Invalid user specified.\n々 Tag someone properly, fool.\n╭───( ✓ )───`);
      }

      const parts = users.split('@')[0];

      try {
        await client.groupParticipantsUpdate(m.chat, [users], 'promote');
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Pʀᴏᴍᴏᴛᴇᴅ ≪───\n々 @${parts} is now an admin.\n々 Don't let the power go to\n々 your empty head.\n╭───( ✓ )───`, {
          mentions: [users]
        });
      } catch (error) {
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 Couldn't promote that user.\n々 Error: ${error.message}\n╭───( ✓ )───`);
      }
    });
  }
};
