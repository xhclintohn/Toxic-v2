module.exports = {
  name: 'button',
  aliases: ['btn'],
  description: 'Sends an interactive button menu',
  run: async (context) => {
    const { client, m } = context;

    try {
      const buttonMessage = {
        text: 'Choose an option below:',
        footer: 'Toxic-MD Bot',
        buttons: [
          { buttonId: 'help', buttonText: { displayText: '📌 Help' }, type: 1 },
          { buttonId: 'ping', buttonText: { displayText: '🏓 Ping' }, type: 1 },
          { buttonId: 'info', buttonText: { displayText: 'ℹ Info' }, type: 1 }
        ],
        headerType: 1
      };

      await client.sendMessage(m.chat, buttonMessage, { quoted: m });

    } catch (error) {
      console.error(`Button command error: ${error.stack}`);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\nSomething went wrong, @${m.sender.split('@')[0]}! Try again.\n◈━━━━━━━━━━━━━━━━◈`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};