const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays a simplified bot command menu with list buttons and a voice note',
  run: async (context) => {
    try {
      const { client, m, mode, pict, botname, text } = context;

      if (text) {
        return client.sendMessage(m.chat, { 
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, what's with the extra bullshit? Just say ${prefix}menu, moron.` 
        }, { quoted: m });
      }

      const settings = await getSettings();
      const effectivePrefix = settings.prefix || '';

      // First send the list message
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, B*tches!* 😈\n\n` +
              `🤖 *Bσƚ*: ${botname}\n` +
              `🔣 *Pɾҽϝιx*: ${effectivePrefix || 'None'}\n` +
              `🌐 *Mσԃҽ*: ${mode}\n` +
              `\n◈━━━━━━━━━━━━━━━━◈\n\n` +
              `*Select an option Below, Loser.* 😈`,
        footer: `Pσɯҽɾҽԃ Ⴆყ ${botname}`,
        title: `${botname} COMMAND MENU`,
        buttonText: "VIEW OPTIONS",
        sections: [
          {
            title: "MAIN COMMANDS",
            rows: [
              {
                title: "📃 FULL MENU",
                description: "Show all commands",
                rowId: `${effectivePrefix}fullmenu`
              },
              {
                title: "👤 DEVELOPER",
                description: "Contact developer",
                rowId: `${effectivePrefix}dev`
              }
            ]
          },
          {
            title: "BOT INFO",
            rows: [
              {
                title: "🚨 PING",
                description: "Check bot speed",
                rowId: `${effectivePrefix}ping`
              },
              {
                title: "🤖 REPOSITORY",
                description: "Get source code",
                rowId: `${effectivePrefix}repo`
              }
            ]
          }
        ]
      }, { quoted: m });

      // Then send the audio
      const possibleAudioPaths = [
        path.join(__dirname, 'xh_clinton', 'menu.mp3'),
        path.join(process.cwd(), 'xh_clinton', 'menu.mp3'),
        path.join(__dirname, '..', 'xh_clinton', 'menu.mp3'),
      ];

      let audioPath = null;
      for (const possiblePath of possibleAudioPaths) {
        if (fs.existsSync(possiblePath)) {
          audioPath = possiblePath;
          break;
        }
      }

      if (audioPath) {
        await client.sendMessage(m.chat, {
          audio: { url: audioPath },
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'menu.mp3'
        }, { quoted: m });
      }
    } catch (error) {
      console.error('Error in menu command:', error);
    }
  }
};