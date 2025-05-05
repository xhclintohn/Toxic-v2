const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays a simplified bot command menu with buttons and a voice note',
  run: async (context) => {
    const { client, m, mode, pict, botname, text } = context;

    if (text) {
      return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, what’s with the extra bullshit? Just say ${prefix}menu, moron.` }, { quoted: m });
    }

    try {
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings, you dumb fuck.' }, { quoted: m });
        return;
      }

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

      // Define button commands with toxic emojis
      const buttonCommands = [
        { id: 'fullmenu', display: toFancyFont('FULLMENU'), emoji: '🔥' },
        { id: 'dev', display: toFancyFont('DEV'), emoji: '💀' },
        { id: 'ping', display: toFancyFont('PING'), emoji: '🏓' },
        { id: 'uptime', display: toFancyFont('UPTIME'), emoji: '⏰' }
      ];

      let menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, Bitches!* 😈\n\n`;
      menuText += `🤖 *Bσƚ*: ${botname} (bow down)\n`;
      menuText += `🔣 *Pɾҽϝιx*: ${effectivePrefix || 'None'} (learn it, dumbass)\n`;
      menuText += `🌐 *Mσԃҽ*: ${mode} (deal with it)\n`;
      menuText += `\n◈━━━━━━━━━━━━━━━━◈\n\n`;
      menuText += `*Pick an option Below, Loser!* 😈\n`;

      await client.sendMessage(m.chat, {
        text: menuText,
        footer: `Pσɯҽɾҽԃ Ⴆყ ${botname}`,
        buttons: buttonCommands.map(cmd => ({
          buttonId: `${effectivePrefix}${cmd.id}`,
          buttonText: { displayText: `${cmd.emoji} ${cmd.display}` },
          type: 1
        })),
        headerType: 1,
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
        console.log(`✅ Found audio at ${audioPath}`);
        await client.sendMessage(m.chat, {
          audio: { url: audioPath },
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'menu.mp3'
        }, { quoted: m });
      } else {
        console.error('❌ Audio file not found at any of the following paths:', possibleAudioPaths);
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit, couldn’t find the menu voice note. Check if xh_clinton/menu.mp3 exists, you slacker.\n\nPowered by *${botname}*`
        }, { quoted: m });
      }

    } catch (error) {
      console.error('Error generating button menu or sending voice note:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something fucked up the menu or voice note. Try again later, loser.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};