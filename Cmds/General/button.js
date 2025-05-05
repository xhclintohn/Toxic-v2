const { default: makeWASocket } = require('baileys-elite');
const { getSettings } = require("../../Database/config");

module.exports = {
  name: 'button',
  aliases: ['btn'],
  description: 'Sends an interactive button menu',
  run: async (context) => {
    const { client, m } = context;

    try {
      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: 'Error: Could not load settings.' }, { quoted: m });
        return;
      }

      const prefix = settings.prefix || ''; // Use empty string for prefixless mode

      await client.sendMessage(m.chat, {
        text: '𝑪𝑯𝑶𝑶𝑺𝑬 𝑨𝑵 𝑶𝑷𝑻𝑰𝑶𝑵 :',
        footer: 'TPσɯҽɾҽԃ Ⴆყ Tσxιƈ-MD',
        buttons: [
          { buttonId: `${prefix}help`, buttonText: { displayText: '📌 𝙈𝙀𝙉𝙐' }, type: 1 },
          { buttonId: `${prefix}ping`, buttonText: { displayText: '🏓 𝙋𝙄𝙉𝙂' }, type: 1 },
          { buttonId: `${prefix}owner`, buttonText: { displayText: '🖤𝙊𝙒𝙉𝙀𝙍 ' }, type: 1 }
        ],
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

    } catch (error) {
      console.error(`Button command error: ${error.stack}`);
      await client.sendMessage(m.chat, { text: 'Error executing button command.' }, { quoted: m });
    }
  }
};