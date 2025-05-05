const { default: makeWASocket } = require('baileys-elite');

module.exports = {
  name: 'button',
  aliases: ['btn'],
  description: 'Sends an interactive button menu',
  run: async (context) => {
    const { client, m } = context;

    try {
      await client.sendMessage(m.chat, {
        text: 'Choose an option below:',
        footer: 'Toxic-MD Bot',
        buttons: [
          { buttonId: '.help', buttonText: { displayText: '📌 Help' }, type: 1 },
          { buttonId: '.ping', buttonText: { displayText: '🏓 Ping' }, type: 1 },
          { buttonId: '.info', buttonText: { displayText: 'ℹ Info' }, type: 1 },
          { buttonId: 'url', buttonText: { displayText: '🔗 Open Website' }, type: 2, url: 'https://example.com' }
        ],
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

    } catch (error) {
      console.error(`Button command error: ${error.stack}`);
    }
  }
};
