const { DateTime } = require('luxon');
const fs = require('fs');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'fullmenu',
  aliases: ['allmenu', 'commandslist'],
  description: 'Displays the full bot command menu by category',
  run: async (context) => {
    const { client, m, totalCommands, mode, pict, botname } = context;

    // Handle invalid input
    if (context.text) {
      try {
        await client.sendMessage(m.chat, { text: `═══════ ✦ ═══════\n│❒ Please use *${context.prefix}fullmenu* without extra text. Let's keep it simple! 😊` }, { quoted: m });
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
          await client.sendMessage(m.chat, { text: `═══════ ✦ ═══════\n│❒ Oops, couldn't load settings. Try again later!` }, { quoted: m });
        } catch (error) {
          console.error(`[DEBUG] Error sending settings error message: ${error.message}`);
        }
        return;
      }

      const effectivePrefix = settings.prefix || ''; // Use empty string for prefixless mode

      const categories = [
        { name: 'General', display: 'Gҽɳҽɾαʅ', emoji: '📜' },
        { name: 'Settings', display: 'Sҽƚƚιɳɠʂ', emoji: '🛠️' },
        { name: 'Owner', display: 'Oɯɳҽɾ', emoji: '👑' },
        { name: 'Heroku', display: 'Hҽɾσƙυ', emoji: '☁️' },
        { name: 'Wa-Privacy', display: 'Wα-Pɾιʋαƈყ', emoji: '🔒' },
        { name: 'Groups', display: 'Gɾσυρʂ', emoji: '👥' },
        { name: 'AI', display: 'AI', emoji: '🧠' },
        { name: 'Media', display: 'Mҽԃια', emoji: '🎬' },
        { name: 'Editting', display: 'Eԃιƚƚιɳɠ', emoji: '✂️' },
        { name: 'Logo', display: 'Lσɠσ', emoji: '🎨' },
        { name: '+18', display: '+18', emoji: '🔞' },
        { name: 'Utils', display: 'Uƚιʅʂ', emoji: '🔧' }
      ];

      const getGreeting = () => {
        const currentHour = DateTime.now().setZone('Africa/Nairobi').hour;
        if (currentHour >= 5 && currentHour < 12) return 'Good Morning, early riser! 🌞';
        if (currentHour >= 12 && currentHour < 18) return 'Good Afternoon, sunshine! 🌞';
        if (currentHour >= 18 && currentHour < 22) return 'Good Evening, star gazer! 🌙';
        return 'Good Night, moon chaser! 🌌';
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

      let menuText = `═══════ ✦ ═══════\n│☆ *Welcome to ${toFancyFont(botname)}!* ☢\n\n`;
      menuText += `${getGreeting()} @${m.sender.split('@')[0]}\n\n`;
      menuText += `👤 *Uʂҽɾ*: @${m.sender.split('@')[0]}\n`;
      menuText += `🤖 *Bσƚ*: ${toFancyFont(botname)}\n`;
      menuText += `📋 *Tσƚαʅ Cσɱɱαɳԃʂ*: ${totalCommands}\n`;
      menuText += `🕒 *Tιɱҽ*: ${getCurrentTimeInNairobi()}\n`;
      menuText += `🔣 *Pɾҽϝιx*: ${effectivePrefix || 'None'}\n`;
      menuText += `🌐 *Mσԃҽ*: ${mode}\n`;
      menuText += `📚 *LιႦɾαɾყ*: Baileys\n`;
      menuText += `\n═══════ ✦ ═══════\n\n`;

      menuText += `*📜 Command Codex ☠*\n`;

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

        menuText += `\n━ 《${category.display} ${category.emoji}》 ━\n`;

        if (category.name === '+18') {
          const plus18Commands = ['xvideo'];
          for (const cmd of plus18Commands) {
            const fancyCommandName = toFancyFont(cmd);
            menuText += `  ➤ *${fancyCommandName}*\n`;
            commandCount++;
          }
        }

        for (const file of commandFiles) {
          const commandName = file.replace('.js', '');
          const fancyCommandName = toFancyFont(commandName);
          menuText += `  ➤ *${fancyCommandName}*\n`;
          commandCount++;
        }
      }

      menuText += `\n═══════ ✦ ═══════\n`;
      menuText += `*Unleash the power of ${toFancyFont(botname)}! ☆*\n`;
      menuText += `Powered by Toxic-MD\n`;
      menuText += `❦ ✦ ☆ ☢\n`;

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
          buttons: [
            { buttonId: `${effectivePrefix}repo`, buttonText: { displayText: `📜 ${toFancyFont('REPO')}` }, type: 1 }
          ],
          headerType: 1,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: false,
              title: `${botname} Repository`,
              body: `Explore the source of ${botname}!`,
              thumbnail: pict,
              sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
              mediaType: 1,
              renderLargerThumbnail: true
            },
            mentionedJid: [m.sender]
          }
        }, { quoted: m });
        console.log(`[DEBUG] Menu sent successfully to ${m.chat}`);
      } catch (error) {
        console.error(`[DEBUG] Error sending menu: ${error.message}`);
        try {
          await client.sendMessage(m.chat, { text: `═══════ ✦ ═══════\n│❒ Sorry, couldn't send the menu. Try again later!\n\nPowered by Toxic-MD` }, { quoted: m });
        } catch (fallbackError) {
          console.error(`[DEBUG] Error sending fallback message: ${fallbackError.message}`);
        }
      }

    } catch (error) {
      console.error('Error generating full menu:', error);
      try {
        await client.sendMessage(m.chat, { text: `═══════ ✦ ═══════\n│❒ Sorry, something went wrong with the menu. Try again later!\n\nPowered by Toxic-MD` }, { quoted: m });
      } catch (fallbackError) {
        console.error(`[DEBUG] Error sending error message: ${fallbackError.message}`);
      }
    }
  }
};