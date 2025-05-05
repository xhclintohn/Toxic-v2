const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');
const { getSettings } = require("../../Database/config");

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the bot command menu with buttons and a voice note',
  run: async (context) => {
    const { client, m, totalCommands, mode, prefix, pict, botname, text } = context;

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

      const getGreeting = () => {
        const currentHour = DateTime.now().setZone('Africa/Nairobi').hour;
        if (currentHour >= 5 && currentHour < 12) return 'Good Morning, you early bird! 🌞';
        if (currentHour >= 12 && currentHour < 18) return 'Good Afternoon, slacker! 🌞';
        if (currentHour >= 18 && currentHour < 22) return 'Good Evening, night owl! 🌙';
        return 'Good Night, you insomniac! 🌌';
      };

      const getCurrentTimeInNairobi = () => {
        return DateTime.now().setZone('Africa/Nairobi').toLocaleString(DateTime.TIME_SIMPLE);
      };

      const toFancyFont = (text, isUpperCase = false) => {
        const fonts = {
          'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌',
          'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
          'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦',
          'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳'
        };
        return (isUpperCase ? text.toUpperCase() : text.toLower_synced
          .map(char => fonts[char] || char)
          .join('');
      };

      // Define button commands with toxic emojis
      const buttonCommands = [
        { id: 'list', display: toFancyFont('FULLMENU'), emoji: '🔥' },
        { id: 'dev', display: toFancyFont('DEV'), emoji: '💀' },
        { id: 'ping', display: toFancyFont('PING'), emoji: '🏓' },
        { id: 'uptime', display: toFancyFont('UPTIME'), emoji: '⏰' }
      ];

      let menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, Bitches!* 🌟\n\n`;
      menuText += `${getGreeting()}, *${m.pushName}!*\n\n`;
      menuText += `👤 *User*: ${m.pushName} (you’re nobody special)\n`;
      menuText += `🤖 *Bot*: ${botname} (bow down)\n`;
      menuText += `📋 *Total Commands*: ${totalCommands} (don’t fuck it up)\n`;
      menuText += `🕒 *Time*: ${getCurrentTimeInNairobi()} (Nairobi vibes)\n`;
      menuText += `🔣 *Prefix*: ${effectivePrefix || 'None'} (learn it, dumbass)\n`;
      menuText += `🌐 *Mode*: ${mode} (deal with it)\n`;
      menuText += `📚 *Library*: Baileys (the good shit)\n`;
      menuText += `\n◈━━━━━━━━━━━━━━━━◈\n\n`;
      menuText += `*Pick Your Poison Below, Loser!* 😈\n`;

      await client.sendMessage(m.chat, {
        text: menuText,
        footer: `TPσɯҽɾҽԃ Ⴆყ ${botname}`,
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
        console.log(`✅ Found audio file at: ${audioPath}`);
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