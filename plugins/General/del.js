module.exports = {
  name: 'del',
  aliases: ['delete', 'd'],
  description: 'Deletes the replied-to or quoted message, you lazy fuck',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      if (!m || !m.key) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 invalid message object, you dumbass! 😈\n╭───( ✓ )───`);
      }

      const isGroup = m.key.remoteJid.endsWith('@g.us');
      const userNumber = m.sender.split('@')[0];

      if (!m.quoted) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 reply to a message to delete, you dumbass! 😈\n╭───( ✓ )───`);
      }

      const deleteKey = {
        remoteJid: m.chat,
        id: m.quoted.id,
        fromMe: m.quoted.fromMe || false
      };

      if (!deleteKey.fromMe) {
        deleteKey.participant = m.quoted.sender;
      }

      if (isGroup) {
        const groupMetadata = await client.groupMetadata(m.key.remoteJid);
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const groupAdmins = groupMetadata.participants.filter(p => p.admin != null).map(p => p.id);

        const isBotAdmin = groupAdmins.includes(botJid);
        const isUserAdmin = groupAdmins.includes(m.sender);

        if (!isBotAdmin) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 i'm not admin, you lazy fuck!\n々 can't delete messages in this group\n々 make me admin first! 🤖\n╭───( ✓ )───`);
        }

        if (!deleteKey.fromMe && !isUserAdmin) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 you're not admin, @${userNumber}!\n々 only admins can delete others' messages\n々 get promoted or shut up 🤡\n╭───( ✓ )───`, {
            mentions: [m.sender]
          });
        }
      }

      await client.sendMessage(m.key.remoteJid, { delete: deleteKey });

      await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 message deleted, you sneaky bastard @${userNumber}! 🗑️\n々 powered by ${botname} 😈\n╭───( ✓ )───`, {
        mentions: [m.sender]
      });

    } catch (error) {
      console.error(`del command error:`, error);
      await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 shit broke, @${m.sender.split('@')[0]}!\n々 couldn't delete the message\n々 error: ${error.message}\n々 try again, you useless fuck 🤦🏻\n╭───( ✓ )───`, {
        mentions: [m.sender]
      });
    }
  }
};