const middleware = require('../../utility/botUtil/middleware');

module.exports = {
  name: 'kiss',
  aliases: ['smooch', 'peck'],
  description: 'Kisses a tagged user with a toxic, realistic reaction',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m } = context;

      try {
        console.log(`Kiss command context: isGroup=${m.isGroup}, mentionedJid=${JSON.stringify(m.mentionedJid)}, sender=${m.sender}`);

        if (!m.mentionedJid || m.mentionedJid.length === 0) {
          console.error('No tagged user provided');
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, moron, tag someone to kiss! I ain’t kissing nobody without a target!`);
        }

        const targetUser = m.mentionedJid[0];
        console.log(`Tagged JID: ${targetUser}`);

        if (
          !targetUser ||
          typeof targetUser !== 'string' ||
          (!targetUser.includes('@s.whatsapp.net') && !targetUser.includes('@lid'))
        ) {
          console.error(`Invalid target user: ${JSON.stringify(targetUser)}`);
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid user, dumbass! Tag a real person to kiss!`);
        }

        const targetNumber = targetUser.split('@')[0];
        const senderNumber = m.sender.split('@')[0];
        if (!targetNumber || !senderNumber) {
          console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Something’s fucked up with the user IDs. Try again, idiot!`);
        }

        const kissingMsg = await client.sendMessage(
          m.chat,
          {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ @${senderNumber} is puckering up to kiss @${targetNumber}... 💋\n│❒ Hope you’re ready for this, loser!\n◈━━━━━━━━━━━━━━━━◈`,
            mentions: [m.sender, targetUser],
          },
          { quoted: m }
        );

        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

        const intensities = [
          { level: 'Awkward', description: 'a cringey, sloppy peck that made @${targetNumber} gag! @${senderNumber}, you kiss like a dead fish!', emoji: '😖' },
          { level: 'Sweet', description: 'a decent smooch that got @${targetNumber} blushing! @${senderNumber}, not bad, but don’t get cocky!', emoji: '😘' },
          { level: 'Passionate', description: 'a steamy kiss that left @${targetNumber} speechless! @${senderNumber}, you’re a fucking Casanova!', emoji: '🔥💋' },
        ];
        const intensity = intensities[Math.floor(Math.random() * intensities.length)];

        const resultMsg = `◈━━━━━━━━━━━━━━━━◈
*KISS REPORT* ${intensity.emoji}

*KISSER:* @${senderNumber}
*VICTIM:* @${targetNumber}
*INTENSITY:* ${intensity.level}

*VERDICT:* ${intensity.description}

*DISCLAIMER:* This kiss was 100% legit, you hopeless romantic! Deal with it! 😈
◈━━━━━━━━━━━━━━━━◈`;

        await client.sendMessage(
          m.chat,
          {
            text: resultMsg,
            mentions: [m.sender, targetUser],
          },
          { quoted: m }
        );

        if (kissingMsg && kissingMsg.key) {
          try {
            await client.sendMessage(m.chat, { delete: kissingMsg.key });
          } catch (deleteError) {
            console.error(`Failed to delete kissing message: ${deleteError.stack}`);
          }
        }
      } catch (error) {
        console.error(`Kiss command exploded: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke harder than your love life! Can’t kiss right now, you pathetic fuck.`);
      }
    });
  },
};