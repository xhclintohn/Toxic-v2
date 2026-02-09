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
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Nᴏᴛ Aᴅᴍɪɴ ≪───\n々 I'm not admin here, fool.\n々 Make me admin first, then\n々 come crawling back.\n╭───( ✓ )───`);
      }

      if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Usᴀɢᴇ ≪───\n々 Mention or quote a user.\n々 Example: ${prefix}demote @user\n々 Don't waste my time.\n╭───( ✓ )───`);
      }

      let user = m.mentionedJid ? m.mentionedJid[0] : null;
      if (!user && m.quoted) {
        user = m.quoted.sender;
      }
      
      if (!user) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Iɴᴠᴀʟɪᴅ ≪───\n々 Invalid user specified.\n々 Tag someone properly.\n╭───( ✓ )───`);
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
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Nᴏᴛ Aᴅᴍɪɴ ≪───\n々 @${userNumber} isn't even admin.\n々 Can't demote a peasant.\n╭───( ✓ )───`, {
            mentions: [user]
          });
        }

        await client.groupParticipantsUpdate(m.chat, [user], 'demote');
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Dᴇᴍᴏᴛᴇᴅ ≪───\n々 @${userNumber} got stripped of admin.\n々 Back to being a nobody.\n╭───( ✓ )───`, {
          mentions: [user]
        });
      } catch (error) {
        console.error('Demote error:', error);
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 Couldn't demote that user.\n々 Error: ${error.message}\n々 Fucking useless.\n╭───( ✓ )───`);
      }
    });
  },
};