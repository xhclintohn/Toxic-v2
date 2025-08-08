const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays a simplified bot command menu with list buttons and a voice note',
  run: async (context) => {
    const { client, m, mode, pict, botname, text } = context;

    if (text) {
      return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, what's with the extra bullshit? Just say ${prefix}menu, moron.` }, { quoted: m });
    }

    const settings = await getSettings();
    const effectivePrefix = settings.prefix || '';

    const toFancyFont = (text, isUpperCase = false) => {
      const fonts = {
        'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
        'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
        'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
        'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
      };
      return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
        .split('')
        .map(char => fonts[char] || char)
        .join('');
    };

    // Define list sections and commands
    const listSections = [
      {
        title: "MAIN COMMANDS",
        rows: [
          {
            title: "📃 FULL MENU",
            description: "Show all available commands",
            rowId: `${effectivePrefix}fullmenu`
          },
          {
            title: "👤 DEVELOPER",
            description: "Contact the bot developer",
            rowId: `${effectivePrefix}dev`
          }
        ]
      },
      {
        title: "BOT INFO",
        rows: [
          {
            title: "🚨 PING",
            description: "Check bot response time",
            rowId: `${effectivePrefix}ping`
          },
          {
            title: "🤖 REPOSITORY",
            description: "Get the bot source code",
            rowId: `${effectivePrefix}repo`
          }
        ]
      }
    ];

    let menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, B*tches!* 😈\n\n`;
    menuText += `🤖 *Bσƚ*: ${botname} (bow down)\n`;
    menuText += `🔣 *Pɾҽϝιx*: ${effectivePrefix || 'None'} (learn it, dumbass)\n`;
    menuText += `🌐 *Mσԃҽ*: ${mode} (deal with it)\n`;
    menuText += `\n◈━━━━━━━━━━━━━━━━◈\n\n`;
    menuText += `*Select an option Below, Loser.* 😈\n`;

    await client.sendMessage(m.chat, {
      text: menuText,
      footer: `Pσɯҽɾҽԃ Ⴆყ ${botname}`,
      title: `${botname} COMMAND MENU`,
      buttonText: "VIEW OPTIONS",
      sections: listSections,
      viewOnce: true,
      contextInfo: {
        externalAdReply: {
          showAdAttribution: false,
          title: `${botname}`,
          body: `Yo, ${m.pushName}! Ready to fuck shit up?`,
          thumbnail: pict,
          sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });

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
  }
};