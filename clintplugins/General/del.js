module.exports = {
  name: 'del',
  aliases: ['delete', 'd'],
  description: 'Deletes the replied-to or quoted message, you lazy fuck',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      if (!m || !m.key) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 invalid message object, you dumbass! 😈\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
      }

      const isGroup = m.key.remoteJid.endsWith('@g.us');
      const userNumber = m.sender.split('@')[0];

      if (!m.quoted) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 reply to a message to delete, you dumbass! 😈\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
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
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 i'm not admin, you lazy fuck!\n> 々 can't delete messages in this group\n> 々 make me admin first! 🤖\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
        }

        if (!deleteKey.fromMe && !isUserAdmin) {
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 you're not admin, @${userNumber}!\n> 々 only admins can delete others' messages\n> 々 get promoted or shut up 🤡\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`, {
            mentions: [m.sender]
          });
        }
      }

      await client.sendMessage(m.key.remoteJid, { delete: deleteKey });

      await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 message deleted, you sneaky bastard @${userNumber}! 🗑️\n> 々 powered by ${botname} 😈\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`, {
        mentions: [m.sender]
      });

    } catch (error) {
      console.error(`del command error:`, error);
      await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 shit broke, @${m.sender.split('@')[0]}!\n> 々 couldn't delete the message\n> 々 error: ${error.message}\n> 々 try again, you useless fuck 🤦🏻\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`, {
        mentions: [m.sender]
      });
    }
  }
};