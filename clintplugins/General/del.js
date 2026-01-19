module.exports = {
  name: 'del',
  aliases: ['delete', 'd'],
  description: 'Deletes the replied-to or quoted message, you lazy fuck',
  run: async (context) => {
    const { client, m, botname } = context;

    try {
      const isGroup = m.key.remoteJid.endsWith('@g.us');
      const userNumber = m.sender.split('@')[0];

      let deleteKey = null;
      let quotedSender = null;

      if (m.quoted && m.quoted.key) {
        deleteKey = {
          remoteJid: m.quoted.key.remoteJid || m.key.remoteJid,
          fromMe: m.quoted.fromMe,
          id: m.quoted.key.id,
          participant: m.quoted.key.participant || m.quoted.sender
        };
        quotedSender = m.quoted.sender || m.quoted.key.participant;
      }

      if (!deleteKey) {
        return m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ reply to a message to delete, you dumbass! 😈\n◈━━━━━━━━━━━━━━━◈`);
      }

      if (isGroup) {
        const groupMetadata = await client.groupMetadata(m.key.remoteJid);
        const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';
        const groupAdmins = groupMetadata.participants.filter(p => p.admin != null).map(p => p.id);
        
        const isBotAdmin = groupAdmins.includes(botJid);
        const isUserAdmin = groupAdmins.includes(m.sender);

        if (!isBotAdmin) {
          return m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ i'm not admin, you lazy fuck!\n│❒ can't delete messages in this group\n│❒ make me admin first! 🤖\n◈━━━━━━━━━━━━━━━◈`);
        }

        if (!deleteKey.fromMe && !isUserAdmin) {
          return m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ you're not admin, @${userNumber}!\n│❒ only admins can delete others' messages\n│❒ get promoted or shut up 🤡\n◈━━━━━━━━━━━━━━━◈`, {
            mentions: [m.sender]
          });
        }
      }

      await client.sendMessage(m.key.remoteJid, { delete: deleteKey });

      await m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ message deleted, you sneaky bastard @${userNumber}! 🗑️\n│❒ powered by ${botname} 😈\n◈━━━━━━━━━━━━━━━◈`, {
        mentions: [m.sender]
      });

    } catch (error) {
      console.error(`del command error:`, error);
      await m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ shit broke, @${m.sender.split('@')[0]}!\n│❒ couldn't delete the message\n│❒ try again, you useless fuck 🤦🏻\n◈━━━━━━━━━━━━━━━◈`, {
        mentions: [m.sender]
      });
    }
  }
};