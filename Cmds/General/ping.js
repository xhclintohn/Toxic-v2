module.exports = {
  name: 'ping',
  aliases: ['p'],
  description: 'Checks the bot’s response time, you curious slacker',
  run: async (context) => {
    const { client, m, toxicspeed } = context;

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nCan’t read your number, genius! Try again.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Validate toxicspeed
      if (typeof toxicspeed !== 'number' || isNaN(toxicspeed)) {
        console.error(`Invalid toxicspeed: ${toxicspeed}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nPing’s broken, @${m.sender.split('@')[0]}! Speed data’s fucked.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
      }

      const userNumber = m.sender.split('@')[0];
      const pingTime = toxicspeed.toFixed(4);
      const replyText = `◈━━━━━━━━━━━━━━━━◈\n🏓 *Pong, @${userNumber}!*\n⏱️ *Response Time*: ${pingTime}ms\n\nDon’t waste my time, slacker! 😈\n◈━━━━━━━━━━━━━━━━◈`;

      await client.sendMessage(m.chat, {
        text: replyText,
        mentions: [m.sender]
      }, { quoted: m });

    } catch (error) {
      console.error(`Ping command fucked up: ${error.stack}`);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\nPing’s fucked, @${m.sender.split('@')[0]}! Try again, you slacker.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};