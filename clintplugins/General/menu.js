const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays bot command menu with WORKING buttons',
  run: async (context) => {
    const { client, m, mode, pict, botname, text, commandHandler } = context;

    // Toxic response for extra text 😈
    if (text) {
      return client.sendMessage(m.chat, { 
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, stop typing nonsense! Just *${prefix}menu* dumbass!` 
      }, { quoted: m });
    }

    const settings = await getSettings();
    const prefix = settings.prefix || '!';

    // PROPER LIST MESSAGE STRUCTURE
    const listMessage = {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *${botname} COMMANDS* 😈\n` +
            `│❒ *Prefix:* ${prefix}\n` +
            `│❒ *Mode:* ${mode}\n` +
            `◈━━━━━━━━━━━━━━━━◈\n\n` +
            `Tap mf options below 👇`,
      footer: `© ${botname} | Don't fuck it up`,
      title: "MAIN MENU",
      buttonText: "SHOW COMMANDS",
      sections: [
        {
          title: "🔥 CORE COMMANDS",
          rows: [
            {
              title: "📜 FULL MENU",
              description: "All commands available",
              rowId: `${prefix}fullmenu`
            },
            {
              title: "👑 OWNER",
              description: "Bot owner commands",
              rowId: `${prefix}owner`
            }
          ]
        },
        {
          title: "ℹ BOT INFO",
          rows: [
            {
              title: "🏓 PING",
              description: "Check bot speed",
              rowId: `${prefix}ping`
            },
            {
              title: "💾 SOURCE",
              description: "Get bot code",
              rowId: `${prefix}repo`
            }
          ]
        }
      ]
    };

    // Send the list message
    await client.sendMessage(m.chat, listMessage, { quoted: m });

    // AUDIO PART (keep your existing audio code)
    const audioPath = [
      path.join(__dirname, 'xh_clinton', 'menu.mp3'),
      path.join(process.cwd(), 'xh_clinton', 'menu.mp3')
    ].find(p => fs.existsSync(p));

    if (audioPath) {
      await client.sendMessage(m.chat, {
        audio: { url: audioPath },
        ptt: true,
        mimetype: 'audio/mpeg'
      }, { quoted: m });
    }
  }
};