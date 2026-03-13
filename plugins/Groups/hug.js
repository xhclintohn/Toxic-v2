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
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Yo, softie, tag someone or quote\n├ a message to hug! I ain't hugging\n├ nobody without a target!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
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
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Invalid user, dumbass! Tag or\n├ quote a real person to hug!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const targetNumber = targetUser.split('@')[0];
      const senderNumber = m.sender.split('@')[0];
      if (!targetNumber || !senderNumber) {
        console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Something's fucked up with the\n├ user IDs. Try again, idiot!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const huggingMsg = await client.sendMessage(
        m.chat,
        {
          text: `╭───(    TOXIC-MD    )───\n├ \n├ @${senderNumber} is wrapping their\n├ arms around @${targetNumber}...\n├ This might get awkward, bitch!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          mentions: [m.sender, targetUser],
        },
        { quoted: m }
      );

      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

      const intensities = [
        {
          level: 'Awkward',
          description: 'a weird, clingy hug that made @TARGET squirm! @SENDER, you\'re creeping everyone out!',
          emoji: '',
        },
        {
          level: 'Warm',
          description: 'a cozy hug that actually felt nice for @TARGET! @SENDER, you\'re not totally useless!',
          emoji: '',
        },
        {
          level: 'Bone-Crushing',
          description: 'a massive bear hug that nearly broke @TARGET\'s ribs! @SENDER, you\'re a fucking beast!',
          emoji: '',
        },
      ];
      const intensity = intensities[Math.floor(Math.random() * intensities.length)];

      const resultMsg = `╭───(    TOXIC-MD    )───
├───≫ HUG REPORT ≪───
├ 
├ *HUGGER:* @${senderNumber}
├ *VICTIM:* @${targetNumber}
├ *INTENSITY:* ${intensity.level}
├ 
├ *VERDICT:* ${intensity.description.replace('@TARGET', `@${targetNumber}`).replace('@SENDER', `@${senderNumber}`)}
├ 
├ *DISCLAIMER:* This hug was 100% real,
├ you emotional wreck! Deal with it!
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

      if (huggingMsg && huggingMsg.key) {
        try {
          await client.sendMessage(m.chat, { delete: huggingMsg.key });
        } catch (deleteError) {
          console.error(`Failed to delete hugging message: ${deleteError.stack}`);
        }
      }
    } catch (error) {
      console.error(`Hug command exploded: ${error.stack}`);
      await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Shit broke harder than your heart!\n├ Can't hug right now, you pathetic fuck.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
  },
};
