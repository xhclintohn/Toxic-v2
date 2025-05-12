module.exports = {
  name: 'gaycheck',
  aliases: ['gaymeter', 'gcheck'],
  description: 'Checks your gay meter with a random percentage, you curious fuck',
  run: async (context) => {
    const { client, m, botname } = context;
    const ownerNumber = '254735342808';

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\nBot’s fucked. No botname in context. Yell at the dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit’s broken, can’t read your number! Try again, you dumbass.\nCheck https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const userNumber = m.sender.split('@')[0];
      const isOwner = userNumber === ownerNumber;

      // Send checking message with dots
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nChecking Gay Meter for @${userNumber}...\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay for drama

      // Generate percentage
      const percentage = isOwner ? Math.floor(Math.random() * 21) : Math.floor(Math.random() * 101);

      // Determine roast based on percentage
      let roast;
      if (percentage <= 20) {
        roast = isOwner ? 'Barely a blip, you badass dev! 😎' : 'Chill, you’re barely on the radar!';
      } else if (percentage <= 50) {
        roast = 'Hmm, you’re giving some vibes!';
      } else if (percentage <= 80) {
        roast = 'Whoa, you’re lighting up the meter!';
      } else {
        roast = 'Full-on rainbow explosion, you fabulous fuck! 🌈';
      }

      // Build result message (no Credits section)
      const resultMsg = `◈━━━━━━━━━━━━━━━━◈
*Gay Meter Results* 📊
User: @${userNumber}
Percentage: ${percentage}% ${isOwner ? '(Boss privilege!)' : ''}
Status: ${roast}

*Note*
This is just for shits and giggles, don’t cry, you sensitive loser! 😈
◈━━━━━━━━━━━━━━━━◈`;

      await client.sendMessage(m.chat, {
        text: resultMsg,
        mentions: [m.sender]
      }, { quoted: m });

    } catch (error) {
      console.error(`Gaycheck command fucked up: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nShit broke, can’t check your gay meter! Try again, you dumbass.\nCheck https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
    }
  }
};