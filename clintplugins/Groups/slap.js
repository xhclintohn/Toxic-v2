const middleware = require('../../utility/botUtil/middleware');

module.exports = {
  name: 'slap',
  aliases: ['smack', 'hit'],
  description: 'Slaps a tagged user with a toxic, realistic reaction',
  run: async (context) => {
    await middleware(context, async () => {
      const { client, m } = context;

      try {
        // Log message context for debugging
        console.log(`Slap command context: isGroup=${m.isGroup}, mentionedJid=${JSON.stringify(m.mentionedJid)}, sender=${m.sender}`);

        // Check if a user is tagged
        if (!m.mentionedJid || m.mentionedJid.length === 0) {
          console.error('No tagged user provided');
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, dumbass, tag someone to slap! I ain’t smacking thin air!`);
        }

        // Get the first tagged user
        const targetUser = m.mentionedJid[0];
        console.log(`Tagged JID: ${targetUser}`);

        // Validate target user
        if (
          !targetUser ||
          typeof targetUser !== 'string' ||
          (!targetUser.includes('@s.whatsapp.net') && !targetUser.includes('@lid'))
        ) {
          console.error(`Invalid target user: ${JSON.stringify(targetUser)}`);
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Invalid user, idiot! Tag a real person to slap!`);
        }

        // Extract phone numbers
        const targetNumber = targetUser.split('@')[0];
        const senderNumber = m.sender.split('@')[0];
        if (!targetNumber || !senderNumber) {
          console.error(`Failed to extract numbers: target=${targetUser}, sender=${m.sender}`);
          return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Something’s fucked up with the user IDs. Try again, moron!`);
        }

        // Send slapping message with dramatic delay
        const slappingMsg = await client.sendMessage(
          m.chat,
          {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ @${senderNumber} is winding up to slap @${targetNumber}... 🖐️\n│❒ This is gonna sting, bitch!\n◈━━━━━━━━━━━━━━━━◈`,
            mentions: [m.sender, targetUser],
          },
          { quoted: m }
        );

        // Random dramatic delay between 1-3 seconds
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Generate random slap intensity
        const intensities = [
          { level: 'Weak', description: 'a pathetic, limp-wristed tap that barely made @${targetNumber} flinch! You call that a slap, @${senderNumber}? Weak sauce!', emoji: '😴' },
          { level: 'Moderate', description: 'a solid smack that left a red mark on @${targetNumber}’s face! @${senderNumber}, you got some balls, but it’s still meh!', emoji: '🖐️' },
          { level: 'Epic', description: 'a thunderous SLAP that sent @${targetNumber} flying across the room! @${senderNumber}, you absolute savage, that was brutal!', emoji: '💥' },
        ];
        const intensity = intensities[Math.floor(Math.random() * intensities.length)];

        // Build the final toxic result message
        const resultMsg = `◈━━━━━━━━━━━━━━━━◈
*SLAP REPORT* ${intensity.emoji}

*SLAPPER:* @${senderNumber}
*VICTIM:* @${targetNumber}
*INTENSITY:* ${intensity.level}

*VERDICT:* ${intensity.description}

*DISCLAIMER:* This slap was 100% deserved, you pathetic loser! Cry about it! 😈
◈━━━━━━━━━━━━━━━━◈`;

        // Send the final result
        await client.sendMessage(
          m.chat,
          {
            text: resultMsg,
            mentions: [m.sender, targetUser],
          },
          { quoted: m }
        );

        // Delete the slapping message for cleaner look
        if (slappingMsg && slappingMsg.key) {
          try {
            await client.sendMessage(m.chat, { delete: slappingMsg.key });
          } catch (deleteError) {
            console.error(`Failed to delete slapping message: ${deleteError.stack}`);
          }
        }
      } catch (error) {
        console.error(`Slap command exploded: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke harder than your ego! Can’t slap right now, you unlucky fuck.`);
      }
    });
  },
};