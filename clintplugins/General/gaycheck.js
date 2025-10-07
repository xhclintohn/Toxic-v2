module.exports = {
  name: 'gaycheck',
  aliases: ['gaymeter', 'gcheck', 'howgay'],
  description: 'Checks gay percentage with toxic, violent, and realistic roasts',
  run: async (context) => {
    const { client, m } = context;

    try {
      // Determine who to check - mentioned user or command sender
      let targetUser;
      let targetNumber;
      
      if (m.mentionedJid && m.mentionedJid.length > 0) {
        // Use the first mentioned user
        targetUser = m.mentionedJid[0];
        targetNumber = targetUser.split('@')[0];
      } else if (m.quoted) {
        // Use the quoted user
        targetUser = m.quoted.sender;
        targetNumber = targetUser.split('@')[0];
      } else {
        // Use the command sender
        targetUser = m.sender;
        targetNumber = targetUser.split('@')[0];
      }

      // Validate target user
      if (!targetUser || typeof targetUser !== 'string' || !targetUser.includes('@s.whatsapp.net')) {
        console.error(`Invalid target user: ${JSON.stringify(targetUser)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nWho the fuck am I checking? Tag someone or I'll check your dumb ass!\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Send checking message with dramatic delay
      const checkingMsg = await m.reply(`◈━━━━━━━━━━━━━━━━◈\nScanning @${targetNumber}'s soul for gay vibes... 🔍\nThis might hurt, bitch!\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [targetUser] });
      
      // Random dramatic delays between 1-3 seconds
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Generate completely random percentage (0-100%)
      const percentage = Math.floor(Math.random() * 101);

      // Toxic, violent, and realistic roasts based on percentage
      let roast;
      let emoji;
      
      if (percentage === 0) {
        roast = "STRAIGHT AS A FUCKING ARROW! You're so straight you make rulers look curved, you basic bitch!";
        emoji = "🚫🏳️‍🌈";
      } else if (percentage <= 10) {
        roast = "Barely a flicker! You probably just appreciate good fashion, you confused little shit.";
        emoji = "😴";
      } else if (percentage <= 20) {
        roast = "Slight rainbow dust! You've definitely checked out someone of the same gender, you curious fuck.";
        emoji = "🤔";
      } else if (percentage <= 35) {
        roast = "Getting warmer! You've had at least one 'what if' thought, you closet case!";
        emoji = "🌡️";
      } else if (percentage <= 50) {
        roast = "50/50! You're as confused as a chameleon in a bag of skittles, you indecisive bastard!";
        emoji = "⚖️";
      } else if (percentage <= 65) {
        roast = "Definitely some vibes! You've probably experimented and liked it, you sneaky slut!";
        emoji = "🌈";
      } else if (percentage <= 80) {
        roast = "RAINBOW ALERT! You're gayer than a pride parade on steroids, you fabulous disaster!";
        emoji = "🏳️‍🌈";
      } else if (percentage <= 95) {
        roast = "EXTREMELY GAY! You make Elton John look straight, you rainbow-colored menace!";
        emoji = "🌈🔥";
      } else {
        roast = "MAXIMUM GAY OVERLOAD! You invented homosexuality, you glorious rainbow explosion!";
        emoji = "🌈💥🏳️‍🌈";
      }

      // Add some violent/insulting flavor based on percentage
      let insult = "";
      if (percentage < 20) {
        insult = " Go touch some grass, you boring fuck!";
      } else if (percentage > 80) {
        insult = " The whole community thanks you for your service, you magnificent queer!";
      } else {
        const insults = [
          " You basic bitch!",
          " You confused little shit!",
          " Get your life together!",
          " Even your mom is disappointed!",
          " What a fucking mess!",
          " You make babies cry!",
          " Your existence is a mistake!"
        ];
        insult = insults[Math.floor(Math.random() * insults.length)];
      }

      // Build the final toxic result message
      const resultMsg = `◈━━━━━━━━━━━━━━━━◈
*GAY METER RESULTS* ${emoji}

*TARGET:* @${targetNumber}
*GAY PERCENTAGE:* ${percentage}% 

*VERDICT:* ${roast}${insult}

*DISCLAIMER:* This is 100% accurate and scientific, you sensitive snowflake! Cry about it! 😈
◈━━━━━━━━━━━━━━━━◈`;

      // Send the final result
      await client.sendMessage(m.chat, {
        text: resultMsg,
        mentions: [targetUser]
      }, { quoted: m });

      // Delete the checking message for cleaner look
      if (checkingMsg) {
        await client.sendMessage(m.chat, {
          delete: checkingMsg.key
        });
      }

    } catch (error) {
      console.error(`Gaycheck command exploded: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit broke harder than your will to live! Can't check gay levels right now, you unlucky fuck.\n◈━━━━━━━━━━━━━━━━◈`);
    }
  }
};
