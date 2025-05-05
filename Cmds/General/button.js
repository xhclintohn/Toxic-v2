const { default: makeWASocket } = require('baileys-elite');

module.exports = {
  name: 'button',
  aliases: ['btn'],
  description: 'Sends an interactive button menu',
  run: async (context) => {
    const { client, m } = context;

    try {
      await client.sendMessage(m.chat, {
        text: '𝑪𝑯𝑶𝑶𝑺𝑬 𝑨𝑵 𝑶𝑷𝑻𝑰𝑶𝑵 :',
        footer: 'TPσɯҽɾҽԃ Ⴆყ Tσxιƈ-MD',
        buttons: [
          { buttonId: '.help', buttonText: { displayText: '📌 𝙈𝙀𝙉𝙐' }, type: 1 },
          { buttonId: '.ping', buttonText: { displayText: '🏓 𝙋𝙄𝙉𝙂' }, type: 1 },
          { buttonId: '.owner', buttonText: { displayText: '🖤𝙊𝙒𝙉𝙀𝙍 ' }, type: 1 }
        ],
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

    } catch (error) {
      console.error(`Button command error: ${error.stack}`);
    }
  }
};