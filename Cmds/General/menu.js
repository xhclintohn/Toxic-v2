const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the bot command menu with a voice note',
  run: async (context) => {
    const { client, m, totalCommands, prefix, pict, botname, text } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\nBot’s toast, no botname found! Yell at the dev, you legend.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nCan’t read your number, you beast! Try again.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const userNumber = m.sender.split('@')[0];

      // Handle extra text
      if (text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nCut the crap, @${userNumber}! Just use ${prefix}menu, you legend. 😈\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
      }

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
        const hour = DateTime.now().setZone('Africa/Nairobi').hour;
        if (hour >= 5 && hour < 12) return 'Morning, you early savage! 🌞';
        if (hour >= 12 && hour < 18) return 'Afternoon, you epic beast! 🌟';
        if (hour >= 18 && hour < 22) return 'Evening, you night slayer! 🌙';
        return 'Night, you moonlit rebel! 🌌';
      };

      const toFancyFont = (text, isUpperCase = false) => {
        const fonts = {
          'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌',
          'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '�{Z}',
          'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦',
          'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳'
        };
        return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
          .split('')
          .map(char => fonts[char] || char)
          .join('');
      };

      // Build menu
      let menuText = `◈━━━━━━━━━━━━━━━━◈\n*Unleash ${botname}, you legend!* 🌟\n\n`;
      menuText += `${getGreeting()}, @${userNumber}!\n`;
      menuText += `Master ${totalCommands || 'tons of'} commands with *${prefix}* (e.g., *${prefix}video music*).\n`;
      menuText += `Don’t choke, rock this shit! 🔥\n`;
      menuText += `\n*📖 Command Menu*\n`;

      for (const category of categories) {
        const commandFiles = fs.readdirSync(`./Cmds/${category.name}`).filter(file => file.endsWith('.js'));
        if (commandFiles.length === 0 && category.name !== '+18') continue;

        const fancyCategory = toFancyFont(category.name, true);
        menuText += `\n✦═════ ✦\n${category.emoji} *${fancyCategory}*\n`;

        if (category.name === '+18') {
          const plus18Commands = ['xvideo'];
          for (const cmd of plus18Commands) {
            const fancyCommandName = toFancyFont(cmd);
            menuText += `  • *${fancyCommandName}*\n`;
          }
        }

        for (const file of commandFiles) {
          const commandName = file.replace('.js', '');
          const fancyCommandName = toFancyFont(commandName);
          menuText += `  • *${fancyCommandName}*\n`;
        }
        menuText += `✦═════ ✦\n`;
      }

      menuText += `\n◈━━━━━━━━━━━━━━━━◈\n`;
      menuText += `Powered by *${botname}* 🗿\n`;

      // Send menu with contextInfo
      await client.sendMessage(m.chat, {
        text: menuText,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `Yo, @${userNumber}! Time to slay with ${botname}!`,
            body: `Drop ${prefix}menu to own the game!`,
            thumbnail: pict || null,
            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

      // Send voice note
      const audioPath = path.join(__dirname, '..', 'xh_clinton', 'menu.mp3');
      if (fs.existsSync(audioPath)) {
        console.log(`✅ Found audio file at: ${audioPath}`);
        await client.sendMessage(m.chat, {
          audio: { url: audioPath },
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'menu.mp3'
        }, { quoted: m });
      } else {
        console.error(`❌ Audio file not found at: ${audioPath}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\nNo voice note, @${userNumber}! Menu’s still fire, so don’t slack. 🔥\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
      }

    } catch (error) {
      console.error(`Menu command fucked up: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nMenu’s fucked, @${userNumber}! Try again, you legend.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
    }
  }
};