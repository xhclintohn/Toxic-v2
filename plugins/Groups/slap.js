module.exports = {
  name: 'slap',
  aliases: ['smack', 'hit'],
  description: 'Slaps a tagged or quoted user with a toxic, realistic reaction',
  run: async (context) => {
    const { client, m } = context;

    try {
      console.log(`Slap command context: isGroup=${m.isGroup}, mentionedJid=${JSON.stringify(m.mentionedJid)}, quotedSender=${m.quoted?.sender || 'none'}, sender=${m.sender}`);

      if (!m.mentionedJid || m.mentionedJid.length === 0) {
        if (!m.quoted || !m.quoted.sender) {
          console.error('No tagged or quoted user provided');
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Yo, dumbass, tag someone or quote\n├ a message to slap! I ain't\n├ smacking thin air!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
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
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Invalid user, idiot! Tag or quote\n├ a real person to slap!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const targetNumber = targetUser.split('@')[0];
      const senderNumber = m.sender.split('@')[0];
      if (!targetNumber || !senderNumber) {
        console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Something's fucked up with the\n├ user IDs. Try again, moron!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const slappingMsg = await client.sendMessage(
        m.chat,
        {
          text: `╭───(    TOXIC-MD    )───\n├ \n├ @${senderNumber} is winding up to\n├ slap @${targetNumber}...\n├ This is gonna sting, bitch!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          mentions: [m.sender, targetUser],
        },
        { quoted: m }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const intensities = [
        {
          level: 'Weak',
          description: 'a pathetic, limp-wristed tap that barely made @TARGET flinch! You call that a slap, @SENDER? Weak sauce!',
          emoji: '',
        },
        {
          level: 'Moderate',
          description: 'a solid smack that left a red mark on @TARGET\'s face! @SENDER, you got some balls, but it\'s still meh!',
          emoji: '',
        },
        {
          level: 'Epic',
          description: 'a thunderous SLAP that sent @TARGET flying across the room! @SENDER, you absolute savage, that was brutal!',
          emoji: '',
        },
      ];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];

      const resultMsg = `╭───(    TOXIC-MD    )───
├───≫ SLAP REPORT ≪───
├ 
├ *SLAPPER:* @${senderNumber}
├ *VICTIM:* @${targetNumber}
├ *INTENSITY:* ${intensity.level}
├ 
├ *VERDICT:* ${intensity.description.replace('@TARGET', `@${targetNumber}`).replace('@SENDER', `@${senderNumber}`)}
├ 
├ *DISCLAIMER:* This slap was 100% deserved,
├ you pathetic loser! Cry about it!
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

      if (slappingMsg && slappingMsg.key) {
        try {
          await client.sendMessage(m.chat, { delete: slappingMsg.key });
        } catch (deleteError) {
          console.error(`Failed to delete slapping message: ${deleteError.stack}`);
        }
      }
    } catch (error) {
      console.error(`Slap command exploded: ${error.stack}`);
      await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Shit broke harder than your ego!\n├ Can't slap right now, you unlucky fuck.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
  },
};
