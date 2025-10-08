const middleware = require('../../utility/botUtil/middleware');

module.exports = {
  name: 'hug',
  aliases: ['cuddle', 'embrace'],
  description: 'Hugs a tagged user with a toxic, realistic reaction',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m } = context;

      try {
        console.log(`Hug command context: isGroup=${m.isGroup}, mentionedJid=${JSON.stringify(m.mentionedJid)}, sender=${m.sender}`);

        if (!m.mentionedJid || m.mentionedJid.length === 0) {
          console.error('No tagged user provided');
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, softie, tag someone to hug! I ain’t hugging nobody without a target!`);
        }

        const targetUser = m.mentionedJid[0];
        console.log(`Tagged JID: ${targetUser}`);

        if (
          !targetUser ||
          typeof targetUser !== 'string' ||
          (!targetUser.includes('@s.whatsapp.net') && !targetUser.includes('@lid'))
        ) {
          console.error(`Invalid target user: ${JSON.stringify(targetUser)}`);
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid user, dumbass! Tag a real person to hug!`);
        }

        const targetNumber = targetUser.split('@')[0];
        const senderNumber = m.sender.split('@')[0];
        if (!targetNumber || !senderNumber) {
          console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Something’s fucked up with the user IDs. Try again, idiot!`);
        }

        const huggingMsg = await client.sendMessage(
          m.chat,
          {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ @${senderNumber} is wrapping their arms around @${targetNumber}... 🤗\n│❒ This might get awkward, bitch!\n◈━━━━━━━━━━━━━━━━◈`,
            mentions: [m.sender, targetUser],
          },
          { quoted: m }
        );

        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

        const intensities = [
          { level: 'Awkward', description: 'a weird, clingy hug that made @${targetNumber} squirm! @${senderNumber}, you’re creeping everyone out!', emoji: '😅' },
          { level: 'Warm', description: 'a cozy hug that actually felt nice for @${targetNumber}! @${senderNumber}, you’re not totally useless!', emoji: '🤗' },
          { level: 'Bone-Crushing', description: 'a massive bear hug that nearly broke @${targetNumber}’s ribs! @${senderNumber}, you’re a fucking beast!', emoji: '💪' },
        ];
        const intensity = intensities[Math.floor(Math.random() * intensities.length)];

        const resultMsg = `◈━━━━━━━━━━━━━━━━◈
*HUG REPORT* ${intensity.emoji}

*HUGGER:* @${senderNumber}
*VICTIM:* @${targetNumber}
*INTENSITY:* ${intensity.level}

*VERDICT:* ${intensity.description}

*DISCLAIMER:* This hug was 100% real, you emotional wreck! Deal with it! 😈
◈━━━━━━━━━━━━━━━━◈`;

        await client.sendMessage(
          m.chat,
          {
            text: resultMsg,
            mentions: [m.sender, targetUser],
          },
          { quoted: m }
        );

        if (huggingMsg && huggingMsg.key) {
          try {
            await client.sendMessage(m.chat, { delete: huggingMsg.key });
          } catch (deleteError) {
            console.error(`Failed to delete hugging message: ${deleteError.stack}`);
          }
        }
      } catch (error) {
        console.error(`Hug command exploded: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke harder than your heart! Can’t hug right now, you pathetic fuck.`);
      }
    });
  },
};