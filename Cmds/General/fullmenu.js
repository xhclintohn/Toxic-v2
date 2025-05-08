const { DateTime } = require('luxon');
const fs = require('fs');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'fullmenu',
  aliases: ['allmenu', 'commandslist'],
  description: 'Displays the full bot command menu by category',
  run: async (context) => {
    const { client, m, totalCommands, mode, pict } = context;
    const botname = '𝐓𝐨𝐱𝐢𝐜-𝐌𝐃'; // Constant bot name in Unicode bold

    // Handle invalid input
    if (context.text) {
      try {
        await client.sendMessage(m.chat, { text: `╭─❒ 「 Error 」\n│ ❒ Please use *${context.prefix}fullmenu* without extra text.\n╰─────────────` }, { quoted: m });
      } catch (error) {
        console.error(`[DEBUG] Error sending invalid input message: ${error.message}`);
      }
      return;
    }

    try {
      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        console.error('Failed to load settings');
        try {
          await client.sendMessage(m.chat, { text: `╭─❒ 「 Error 」\n│ ❒ Unable to load settings. Please try again later.\n╰─────────────` }, { quoted: m });
        } catch (error) {
          console.error(`[DEBUG] Error sending settings error message: ${error.message}`);
        }
        return;
      }

      const effectivePrefix = settings.prefix || ''; // Use empty string for prefixless mode

      const categories = [
        { name: 'General', display: 'GEᑎEᖇᗩᒪ', emoji: '📜' },
        { name: 'Settings', display: 'SETTINGS', emoji: '🛠️' },
        { name: 'Owner', display: 'OWNER', emoji: '👑' },
        { name: 'Heroku', display: 'HEROKU', emoji: '☁️' },
        { name: 'Wa-Privacy', display: 'PRIVACY', emoji: '🔒' },
        { name: 'Groups', display: 'GROUPS', emoji: '👥' },
        { name: 'AI', display: 'AI', emoji: '🧠' },
        { name: 'Media', display: 'MEDIA', emoji: '🎬' },
        { name: 'Editting', display: 'EDITING', emoji: '✂️' },
        { name: 'Logo', display: 'LOGO', emoji: '🎨' },
        { name: '+18', display: '+18', emoji: '🔞' },
        { name: 'Utils', display: 'UTILS', emoji: '🔧' }
      ];

      const getGreeting = () => {
        const currentHour = DateTime.now().setZone('Africa/Nairobi').hour;
        if (currentHour >= 5 && currentHour < 12) return 'Good Morning';
        if (currentHour >= 12 && currentHour < 18) return 'Good Afternoon';
        if (currentHour >= 18 && currentHour < 22) return 'Good Evening';
        return 'Good Night';
      };

      const getCurrentTimeInNairobi = () => {
        return DateTime.now().setZone('Africa/Nairobi').toLocaleString(DateTime.TIME_SIMPLE);
      };

      const toFancyFont = (text, isUpperCase = false) => {
        const fonts = {
          'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝙿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
          'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
          'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
          'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
        };
        return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
          .split('')
          .map(char => fonts[char] || char)
          .join('');
      };

      let menuText = `╭─❒ 「 ${botname} Command Menu 」\n`;
      menuText += `│ Greetings, ${m.pushName}\n`;
      menuText += `│\n`;
      menuText += `│ 👤 *Uʂҽɾ*: ${m.pushName}\n`;
      menuText += `│ 🤖 *Bσƚ*: ${botname}\n`;
      menuText += `│ 📋 *Tσƚαʅ Cσɱɱαɳԃʂ*: ${totalCommands}\n`;
      menuText += `│ 🕒 *Tιɱҽ*: ${getCurrentTimeInNairobi()}\n`;
      menuText += `│ 🔣 *Pɾҽϝιx*: ${effectivePrefix || 'None'}\n`;
      menuText += `│ 🌐 *Mσԃҽ*: ${mode}\n`;
      menuText += `│ 📚 *LιႦɾαɾყ*: Baileys\n`;
      menuText += `╰─────────────\n\n`;

      menuText += `*Command Registry ✦*\n\n`;

      let commandCount = 0;
      for (const category of categories) {
        let commandFiles;
        try {
          commandFiles = fs.readdirSync(`./Cmds/${category.name}`).filter(file => file.endsWith('.js'));
          console.log(`[DEBUG] Category ${category.name}: Found ${commandFiles.length} command files`);
        } catch (error) {
          console.error(`[DEBUG] Error reading directory ./Cmds/${category.name}: ${error.message}`);
          commandFiles = [];
        }

        if (commandFiles.length === 0 && category.name !== '+18') continue;

        menuText += `╭─❒ 「 ${category.display} ${category.emoji} 」\n`;

        if (category.name === '+18') {
          const plus18Commands = ['xvideo'];
          for (const cmd of plus18Commands) {
            const fancyCommandName = toFancyFont(cmd);
            menuText += `│ ✘ *${fancyCommandName}*\n`;
            commandCount++;
          }
        }

        for (const file of commandFiles) {
          const commandName = file.replace('.js', '');
          const fancyCommandName = toFancyFont(commandName);
          menuText += `│ ✘ *${fancyCommandName}*\n`;
          commandCount++;
        }

        menuText += `╰─────────────\n\n`;
      }

      menuText += `╭─❒ 「 Powered by Toxic-MD 」\n`;
      menuText += `│ ✧ Explore ${botname}\n`;
      menuText += `╰─────────────`;

      // Debug: Log menuText length and preview
      console.log(`[DEBUG] menuText length: ${menuText.length} characters`);
      console.log(`[DEBUG] menuText preview: ${menuText.substring(0, 200)}...`);
      console.log(`[DEBUG] Total commands added: ${commandCount}`);
      console.log(`[DEBUG] Sending to chat: ${m.chat}`);

      // Send the message
      try {
        await client.sendMessage(m.chat, {
          text: menuText,
          footer: `Powered by Toxic-MD`,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: false,
              title: `Toxic-MD Source`,
              body: `View the source code of ${botname}`,
              thumbnail: pict,
              sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: m });
        console.log(`[DEBUG] Menu sent successfully to ${m.chat}`);
      } catch (error) {
        console.error(`[DEBUG] Error sending menu: ${error.message}`);
        try {
          await client.sendMessage(m.chat, { text: `╭─❒ 「 Error 」\n│ ❒ Unable to display the menu. Please try again later.\n╰─────────────` }, { quoted: m });
        } catch (fallbackError) {
          console.error(`[DEBUG] Error sending fallback message: ${fallbackError.message}`);
        }
      }

    } catch (error) {
      console.error('Error generating full menu:', error);
      try {
        await client.sendMessage(m.chat, { text: `╭─❒ 「 Error 」\n│ ❒ Unable to generate the menu. Please try again later.\n╰─────────────` }, { quoted: m });
      } catch (fallbackError) {
        console.error(`[DEBUG] Error sending error message: ${fallbackError.message}`);
      }
    }
  }
};