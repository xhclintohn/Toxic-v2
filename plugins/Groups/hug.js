module.exports = {
  name: 'hug',
  aliases: ['cuddle', 'embrace'],
  description: 'Hugs a tagged or quoted user with a toxic, realistic reaction',
  run: async (context) => {
    const { client, m } = context;

    try {
      console.log(`Hug command context: isGroup=${m.isGroup}, mentionedJid=${JSON.stringify(m.mentionedJid)}, quotedSender=${m.quoted?.sender || 'none'}, sender=${m.sender}`);

      if (!m.mentionedJid || m.mentionedJid.length === 0) {
        if (!m.quoted || !m.quoted.sender) {
          console.error('No tagged or quoted user provided');
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Yo, softie, tag someone or quote a message to hug! I ain’t hugging nobody without a target!`);
        }
      }

      const targetUser = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      console.log(`Target JID: ${targetUser}`);

      if (
        !targetUser ||
        typeof targetUser !== 'string' ||
        (!targetUser.includes('@s.whatsapp.net') && !targetUser.includes('@lid'))
      ) {
        console.error(`Invalid target user: ${JSON.stringify(targetUser)}`);
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Invalid user, dumbass! Tag or quote a real person to hug!`);
      }

      const targetNumber = targetUser.split('@')[0];
      const senderNumber = m.sender.split('@')[0];
      if (!targetNumber || !senderNumber) {
        console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Something’s fucked up with the user IDs. Try again, idiot!`);
      }

      const huggingMsg = await client.sendMessage(
        m.chat,
        {
          text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 @${senderNumber} is wrapping their arms around @${targetNumber}... 🤗\n々 This might get awkward, bitch!\n╭───( ✓ )───`,
          mentions: [m.sender, targetUser],
        },
        { quoted: m }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const intensities = [
        {
          level: 'Awkward',
          description: 'a weird, clingy hug that made @TARGET squirm! @SENDER, you’re creeping everyone out!',
          emoji: '😅',
        },
        {
          level: 'Warm',
          description: 'a cozy hug that actually felt nice for @TARGET! @SENDER, you’re not totally useless!',
          emoji: '🤗',
        },
        {
          level: 'Bone-Crushing',
          description: 'a massive bear hug that nearly broke @TARGET’s ribs! @SENDER, you’re a fucking beast!',
          emoji: '💪',
        },
      ];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];

      const resultMsg = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
*HUG REPORT* ${intensity.emoji}

*HUGGER:* @${senderNumber}
*VICTIM:* @${targetNumber}
*INTENSITY:* ${intensity.level}

*VERDICT:* ${intensity.description.replace('@TARGET', `@${targetNumber}`).replace('@SENDER', `@${senderNumber}`)}

*DISCLAIMER:* This hug was 100% real, you emotional wreck! Deal with it! 😈
╭───( ✓ )───`;

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
      await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Shit broke harder than your heart! Can’t hug right now, you pathetic fuck.`);
    }
  },
};