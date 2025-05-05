module.exports = {
  name: 'buttonPing',
  description: 'Handles button clicks for ping response',
  run: async (context) => {
    const { client, m } = context;

    try {
      if (m.buttonId === '.ping') {
        await client.sendMessage(m.chat, {
          text: `🏓 Pong! Your bot speed is **${Date.now() - m.messageTimestamp}ms**.`,
        }, { quoted: m });
      }
    } catch (error) {
      console.error(`Button Ping error: ${error.stack}`);
    }
  }
};
