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
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Yo, perv, tag someone or quote\n├ a message to fuck! I ain't doing\n├ this without a target!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
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
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Invalid user, dumbass! Tag or\n├ quote a real person to fuck!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const targetNumber = targetUser.split('@')[0];
      const senderNumber = m.sender.split('@')[0];
      if (!targetNumber || !senderNumber) {
        console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Something's fucked up with the\n├ user IDs. Try again, idiot!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const fuckingMsg = await client.sendMessage(
        m.chat,
        {
          text: `╭───(    TOXIC-MD    )───\n├ \n├ @${senderNumber} is getting ready\n├ to fuck @${targetNumber}...\n├ This is gonna be wild, bitch!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          mentions: [m.sender, targetUser],
        },
        { quoted: m }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const intensities = [
        {
          level: 'Awkward',
          description: 'a clumsy, embarrassing attempt that made @TARGET laugh their ass off! @SENDER, you\'re a fucking disaster!',
          emoji: '',
        },
        {
          level: 'Steamy',
          description: 'a hot and heavy session that got @TARGET all flustered! @SENDER, you\'re not half bad!',
          emoji: '',
        },
        {
          level: 'Legendary',
          description: 'an earth-shattering fuck that left @TARGET in awe! @SENDER, you\'re a goddamn sex god!',
          emoji: '',
        },
      ];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];

      const resultMsg = `╭───(    TOXIC-MD    )───
├───≫ FUCK REPORT ≪───
├ 
├ *INITIATOR:* @${senderNumber}
├ *VICTIM:* @${targetNumber}
├ *INTENSITY:* ${intensity.level}
├ 
├ *VERDICT:* ${intensity.description.replace('@TARGET', `@${targetNumber}`).replace('@SENDER', `@${senderNumber}`)}
├ 
├ *DISCLAIMER:* This was 100% consensual
├ in this fictional world, you filthy animal!
├ Cry about it!
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

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
      await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Shit broke harder than your\n├ bedframe! Can't fuck right now,\n├ you unlucky bastard.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
  },
};
