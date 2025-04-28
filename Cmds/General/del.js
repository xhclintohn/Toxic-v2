module.exports = {
  name: 'del',
  aliases: ['delete', 'd'],
  description: 'Deletes the quoted message, you lazy fuck',
  run: async (context) => {
    const { client, m, botname } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\nBot’s fucked. No botname in context. Yell at the dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit’s broken, can’t read your number! Try again, you dumbass.\nCheck https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Check if quoted message exists
      if (!m.quoted || !m.quoted.message) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nQuote a message to delete, you dumbass! 😈\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const isGroup = m.key.remoteJid.endsWith('@g.us');
      const userNumber = m.sender.split('@')[0];
      const botJid = client.user.id.split(':')[0] + '@s.whatsapp.net';

      // If in group, check bot admin status for non-bot messages
      if (isGroup && !m.quoted.fromMe) {
        const groupMetadata = await client.groupMetadata(m.key.remoteJid);
        const groupAdmins = groupMetadata.participants.filter(p => p.admin != null).map(p => p.id);
        const isBotAdmin = groupAdmins.includes(botJid);

        if (!isBotAdmin) {
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\nI’m not an admin, you lazy fuck! Can’t delete @${m.quoted.sender.split('@')[0]}’s message. Promote me, @${userNumber}!\n◈━━━━━━━━━━━━━━━━◈`, {
            mentions: [m.quoted.sender, m.sender]
          });
        }
      }

      // Delete the quoted message
      await client.sendMessage(m.key.remoteJid, {
        delete: {
          remoteJid: m.quoted.key.remoteJid,
          fromMe: m.quoted.fromMe,
          id: m.quoted.key.id,
          participant: m.quoted.key.participant || m.quoted.sender
        }
      });

      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nMessage deleted, you sneaky bastard @${userNumber}! 🗑️\nPowered by *${botname}* 😈\n◈━━━━━━━━━━━━━━━━◈`, {
        mentions: [m.sender]
      });

    } catch (error) {
      console.error(`Del command fucked up: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit broke, @${m.sender.split('@')[0]}! Couldn’t delete the message. Try again, you useless fuck.\nCheck https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`, {
        mentions: [m.sender]
      });
    }
  }
};