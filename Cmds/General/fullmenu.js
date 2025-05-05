const { DateTime } = require('luxon');
const fs = require('fs');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'fullmenu',
  aliases: ['allmenu', 'commandslist'],
  description: 'Displays the full bot command menu by category',
  run: async (context) => {
    const { client, m, totalCommands, mode, pict, botname, text } = context;

    if (text) {
      return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, don’t spam bullshit. Just say ${prefix}fullmenu, idiot.` }, { quoted: m });
    }

    try {
      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings, you dumb fuck.` }, { quoted: m });
        return;
      }

      const effectivePrefix = settings.prefix || ''; // Use empty string for prefixless mode

      const categories = [
        { name: 'General', emoji: '📜' },
        { name: 'Settings', emoji: '🛠️' },
        { name: 'Owner', emoji: '👑' },
        { name: 'Heroku', emoji: '☁️' },
        { name: 'Wa-Privacy', emoji: '🔒' },
        { name: 'Groups', emoji: '👥' },
        { name: 'AI', emoji: '🧠' },
        { name: 'Media', emoji: '🎬' },
        { name: 'Editting', emoji: '✂️' },
        { name: 'Logo', emoji: '🎨' },
        { name: '+18', emoji: '🔞' },
        { name: 'Utils', emoji: '🔧' }
      ];

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

      menuText += `*📖 Full Command Menu (Pick Your Poison)*\n`;

      for (const category of categories) {
        const commandFiles = fs.readdirSync(`./Cmds/${category.name}`).filter(file => file.endsWith('.js'));
        if (commandFiles.length === 0 && category.name !== '+18') continue;

        const fancyCategory = toFancyFont(category.name, true);
        menuText += `\n─── ✦ *${fancyCategory} ${category.emoji}* ✦ ───\n`;

        if (category.name === '+18') {
          const plus18Commands = ['xvideo'];
          for (const cmd of plus18Commands) {
            const fancyCommandName = toFancyFont(cmd);
            menuText += `  ➤ *${fancyCommandName}*\n`;
          }
        }

        for (const file of commandFiles) {
          const commandName = file.replace('.js', '');
          const fancyCommandName = toFancyFont(commandName);
          menuText += `  ➤ *${fancyCommandName}*\n`;
        }
      }

      menuText += `\n◈━━━━━━━━━━━━━━━━◈\n`;
      menuText += `*Feel the power of ${botname}, or get lost!*\n`;
      menuText += `🍁🌬️\n`;

      await client.sendMessage(m.chat, {
        text: menuText,
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

    } catch (error) {
      console.error('Error generating full menu:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something fucked up the full menu. Try again later, loser.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};