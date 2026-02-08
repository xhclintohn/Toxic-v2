module.exports = {
  name: 'fuck',
  aliases: ['screw', 'bang'],
  description: 'Sends a toxic, realistic "fuck" reaction to a tagged or quoted user',
  run: async (context) => {
    const { client, m } = context;

    try {
      console.log(`Fuck command context: isGroup=${m.isGroup}, mentionedJid=${JSON.stringify(m.mentionedJid)}, quotedSender=${m.quoted?.sender || 'none'}, sender=${m.sender}`);

      if (!m.mentionedJid || m.mentionedJid.length === 0) {
        if (!m.quoted || !m.quoted.sender) {
          console.error('No tagged or quoted user provided');
          return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Yo, perv, tag someone or quote a message to fuck! I ain’t doing this without a target!`);
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
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Invalid user, dumbass! Tag or quote a real person to fuck!`);
      }

      const targetNumber = targetUser.split('@')[0];
      const senderNumber = m.sender.split('@')[0];
      if (!targetNumber || !senderNumber) {
        console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Something’s fucked up with the user IDs. Try again, idiot!`);
      }

      const fuckingMsg = await client.sendMessage(
        m.chat,
        {
          text: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 @${senderNumber} is getting ready to fuck @${targetNumber}... 😈\n> 々 This is gonna be wild, bitch!\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`,
          mentions: [m.sender, targetUser],
        },
        { quoted: m }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const intensities = [
        {
          level: 'Awkward',
          description: 'a clumsy, embarrassing attempt that made @TARGET laugh their ass off! @SENDER, you’re a fucking disaster!',
          emoji: '😂',
        },
        {
          level: 'Steamy',
          description: 'a hot and heavy session that got @TARGET all flustered! @SENDER, you’re not half bad!',
          emoji: '🔥',
        },
        {
          level: 'Legendary',
          description: 'an earth-shattering fuck that left @TARGET in awe! @SENDER, you’re a goddamn sex god!',
          emoji: '💦🔥',
        },
      ];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];

      const resultMsg = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
*FUCK REPORT* ${intensity.emoji}

*INITIATOR:* @${senderNumber}
*VICTIM:* @${targetNumber}
*INTENSITY:* ${intensity.level}

*VERDICT:* ${intensity.description.replace('@TARGET', `@${targetNumber}`).replace('@SENDER', `@${senderNumber}`)}

*DISCLAIMER:* This was 100% consensual in this fictional world, you filthy animal! Cry about it! 😈
╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`;

      await client.sendMessage(
        m.chat,
        {
          text: resultMsg,
          mentions: [m.sender, targetUser],
        },
        { quoted: m }
      );

      if (fuckingMsg && fuckingMsg.key) {
        try {
          await client.sendMessage(m.chat, { delete: fuckingMsg.key });
        } catch (deleteError) {
          console.error(`Failed to delete fucking message: ${deleteError.stack}`);
        }
      }
    } catch (error) {
      console.error(`Fuck command exploded: ${error.stack}`);
      await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 Shit broke harder than your bedframe! Can’t fuck right now, you unlucky bastard.`);
    }
  },
};