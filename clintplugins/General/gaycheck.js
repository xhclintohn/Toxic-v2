module.exports = {
  name: 'gaycheck',
  aliases: ['gaymeter', 'gcheck'],
  description: 'Checks gay percentage with toxic randomness, you curious fuck',
  run: async (context) => {
    const { client, m, botname } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\nBot's fucked. No botname in context. Yell at the dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Check if someone was mentioned
      let targetUser = m.sender;
      let targetName = 'You';
      
      if (m.mentions && m.mentions.length > 0) {
        targetUser = m.mentions[0];
        targetName = 'This poor soul';
      }

      // Validate target user
      if (!targetUser || typeof targetUser !== 'string' || !targetUser.includes('@s.whatsapp.net')) {
        console.error(`Invalid target user: ${JSON.stringify(targetUser)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit's broken, can't read that number! Try tagging someone properly, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const userNumber = targetUser.split('@')[0];

      // Send checking message with dramatic delay
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nScanning ${targetName}'s gaydar... 🏳️‍🌈\nPreparing results... 💀\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [targetUser] });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate completely random percentage (0-100%)
      const percentage = Math.floor(Math.random() * 101);

      // Toxic messages based on percentage ranges
      let toxicMessage;
      let emoji = '🏳️‍🌈';
      
      if (percentage === 0) {
        toxicMessage = 'LMAO! 0%?! Either you\'re lying to yourself or you\'re so straight you make rulers look curved! 📏';
        emoji = '📏';
      } else if (percentage <= 10) {
        toxicMessage = 'Barely a flicker! You probably think rainbow is just a weather phenomenon, you basic bitch! 🌈➡️🌧️';
        emoji = '🌧️';
      } else if (percentage <= 25) {
        toxicMessage = 'A little curious, huh? Don\'t worry, we won\'t tell your homophobic friends... or will we? 😈';
        emoji = '🤔';
      } else if (percentage <= 40) {
        toxicMessage = 'Okay, definitely some vibes here! You stare at rainbows a little too long, don\'t you? 🌈👀';
        emoji = '👀';
      } else if (percentage <= 60) {
        toxicMessage = 'HALF WAY THERE! Living that bi-curious lifestyle, I see! The closet door is creaking open! 🚪✨';
        emoji = '✨';
      } else if (percentage <= 75) {
        toxicMessage = 'Damn! The meter is BLASTING! You probably organize pride parades in your sleep! 🎉🏳️‍🌈';
        emoji = '🎉';
      } else if (percentage <= 90) {
        toxicMessage = 'HOLY SHIT! The rainbow is STRONG with this one! Even your socks are probably pride-themed! 🌈🧦';
        emoji = '🧦';
      } else if (percentage <= 99) {
        toxicMessage = 'FUCKING FABULOUS! You make unicorns look straight! The entire LGBTQ+ community salutes you! 🦄🎊';
        emoji = '🦄';
      } else {
        toxicMessage = '100% PURE RAINBOW! You invented gay! Even the concept of straight fears you! ABSOLUTE LEGEND! 🌈👑';
        emoji = '👑';
      }

      // Additional random toxic roast
      const extraRoasts = [
        '\n\nYour ancestors are questioning their life choices right now!',
        '\n\nEven I\'m blushing, and I\'m just code!',
        '\n\nThe straights are shaking in their basic boots!',
        '\n\nYour heterosexuality is filing for divorce!',
        '\n\nJesus is either proud or horrified - no in between!',
        '\n\nYour future grandkids will study this in history class!'
      ];
      
      const randomRoast = extraRoasts[Math.floor(Math.random() * extraRoasts.length)];

      // Build result message
      const resultMsg = `◈━━━━━━━━━━━━━━━━◈
*GAY CHECK RESULTS* ${emoji}

*TARGET:* @${userNumber}
*GAY PERCENTAGE:* ${percentage}% 

*VERDICT:*
${toxicMessage}${randomRoast}

◈━━━━━━━━━━━━━━━━◈`;

      await client.sendMessage(m.chat, {
        text: resultMsg,
        mentions: [targetUser]
      }, { quoted: m });

    } catch (error) {
      console.error(`Gaycheck command exploded: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit broke harder than your heterosexuality! Try again, dumbass.\nCheck https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
    }
  }
};
