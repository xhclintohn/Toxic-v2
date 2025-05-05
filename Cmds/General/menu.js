const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays a fully styled bot command menu with fancy font and voice note',
  run: async (context) => {
    const { client, m, mode, pict, botname, text } = context;

    if (text) {
      return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, just say ${prefix}menu, no extra nonsense!` }, { quoted: m });
    }

    try {
      const settings = await getSettings();
      if (!settings) return;

      const effectivePrefix = settings.prefix || '';

      const toFancyFont = (text) => {
        const fonts = {
          'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠',
          'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
          'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺',
          'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇'
        };
        return text.split('').map(char => fonts[char] || char).join('');
      };

      const buttonCommands = [
        { id: 'fullmenu', display: toFancyFont('FULL MENU'), emoji: '🔥' },
        { id: 'dev', display: toFancyFont('DEVELOPER'), emoji: '💀' },
        { id: 'ping', display: toFancyFont('PING'), emoji: '🏓' },
        { id: 'uptime', display: toFancyFont('UPTIME'), emoji: '⏰' }
      ];

      const menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ ${toFancyFont(botname)} ${toFancyFont('MENU')} 😈\n\n`;
      menuText += `🤖 ${toFancyFont('Bot')}: ${botname}\n`;
      menuText += `🔣 ${toFancyFont('Prefix')}: ${effectivePrefix || 'None'}\n`;
      menuText += `🌐 ${toFancyFont('Mode')}: ${mode}\n\n`;
      menuText += `◈━━━━━━━━━━━━━━━━◈\n\n`;
      menuText += `${toFancyFont('Choose an option below!')}`;

      await client.sendMessage(m.chat, {
        text: menuText,
        footer: `Powered by ${botname}`,
        buttons: buttonCommands.map(cmd => ({
          buttonId: `${effectivePrefix}${cmd.id}`,
          buttonText: { displayText: `${cmd.emoji} ${cmd.display}` },
          type: 1
        })),
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

      const possibleAudioPaths = [
        path.join(__dirname, 'xh_clinton', 'menu.mp3'),
        path.join(process.cwd(), 'xh_clinton', 'menu.mp3'),
        path.join(__dirname, '..', 'xh_clinton', 'menu.mp3'),
      ];

      for (const possiblePath of possibleAudioPaths) {
        if (fs.existsSync(possiblePath)) {
          await client.sendMessage(m.chat, {
            audio: { url: possiblePath },
            ptt: true,
            mimetype: 'audio/mpeg',
            fileName: 'menu.mp3'
          }, { quoted: m });
          break;
        }
      }

    } catch {
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Something went wrong. Try again later.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};