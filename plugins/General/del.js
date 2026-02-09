const middleware = require('../../utils/botUtil/middleware');

module.exports = {
  name: 'del',
  aliases: ['delete', 'd'],
  description: 'Deletes the replied-to or quoted message, you lazy fuck',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m, botname, isBotAdmin, isAdmin } = context;

      try {
        if (!m || !m.key) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 invalid message object, you dumbass! 😈\n╭───( ✓ )───`);
        }

        if (!m.quoted) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 reply to a message to delete, you dumbass! 😈\n╭───( ✓ )───`);
        }

        const userNumber = m.sender.split('@')[0];

        if (!isBotAdmin) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 i'm not admin, you lazy fuck!\n々 can't delete messages in this group\n々 make me admin first! 🤖\n╭───( ✓ )───`);
        }

        if (!m.quoted.fromMe && !isAdmin) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 you're not admin, @${userNumber}!\n々 only admins can delete others' messages\n々 get promoted or shut up 🤡\n╭───( ✓ )───`, {
            mentions: [m.sender]
          });
        }

        const deleteKey = {
          remoteJid: m.chat,
          fromMe: m.quoted.fromMe || false,
          id: m.quoted.id,
          participant: m.quoted.fromMe ? undefined : m.quoted.sender
        };

        await client.sendMessage(m.chat, { delete: deleteKey });

        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 message deleted, you sneaky bastard @${userNumber}! 🗑️\n々 powered by ${botname} 😈\n╭───( ✓ )───`, {
          mentions: [m.sender]
        });

      } catch (error) {
        console.error(`del command error:`, error);
        const userNum = m.sender.split('@')[0];
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 shit broke, @${userNum}!\n々 couldn't delete the message\n々 error: ${error.message}\n々 try again, you useless fuck 🤦🏻\n╭───( ✓ )───`, {
          mentions: [m.sender]
        });
      }
    });
  }
};