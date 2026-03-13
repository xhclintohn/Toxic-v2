const { DateTime } = require('luxon');
const fs = require('fs');
const { getSettings } = require('../../database/config');

module.exports = {
  name: 'fullmenu',
  aliases: ['allmenu', 'commandslist'],
  description: 'Displays the full bot command menu by category',
  run: async (context) => {
    const { client, m, totalCommands, mode, pict } = context;
    const botname = '𝐓𝐨𝐱𝐢𝐜-𝐌𝐃'; 

    const settings = await getSettings();
    const effectivePrefix = settings.prefix || ''; 

    const categories = [
      { name: 'General', display: 'GEᑎEᖇᗩᒪMENU', emoji: '📜' },
      { name: 'Settings', display: 'SETTINGSMENU', emoji: '🛠️' },
      { name: 'Owner', display: 'OWNERMENU', emoji: '👑' },
      { name: 'Heroku', display: 'HEROKUMENU', emoji: '☁️' },
      { name: 'Privacy', display: 'PRIVACYMENU', emoji: '🔒' },
      { name: 'Groups', display: 'GROUPMENU', emoji: '👥' },
      { name: 'Ai-Tools', display: 'AIMENJ', emoji: '🧠' },
      { name: 'Downloads', display: 'DOWNLOADMENU', emoji: '🎬' },
      { name: 'Editing', display: 'EDITING', emoji: '✂️' },
      { name: 'Logo', display: 'LOGO', emoji: '🎨' },
      { name: '+18', display: '+18MENU', emoji: '🔞' },
      { name: 'Utils', display: 'UTILSMENU', emoji: '🔧' }
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

    let menuText = `╭───(    TOXIC-MD    )───\n├───≫ Fᴜʟʟ Mᴇɴᴜ ≪───\n├ \n├ Greetings, @${m.pushName}\n├ \n├ Bot: ${botname}\n├ Total Commands: ${totalCommands}\n├ Time: ${getCurrentTimeInNairobi()}\n├ Prefix: ${effectivePrefix || 'None'}\n├ Mode: ${mode}\n├ Library: Baileys\n╰──────────────────☉\n\n`;

    let commandCount = 0;
    for (const category of categories) {
      let commandFiles = fs.readdirSync(`./plugins/${category.name}`).filter(file => file.endsWith('.js'));

      if (commandFiles.length === 0 && category.name !== '+18') continue;

      menuText += `╭───(    TOXIC-MD    )───\n├───≫ ${category.display} ≪───\n├ \n`;

      if (category.name === '+18') {
        const plus18Commands = ['xvideo'];
        for (const cmd of plus18Commands) {
          const fancyCommandName = toFancyFont(cmd);
          menuText += `├ *${fancyCommandName}*\n`;
          commandCount++;
        }
      }

      for (const file of commandFiles) {
        const commandName = file.replace('.js', '');
        const fancyCommandName = toFancyFont(commandName);
        menuText += `├ *${fancyCommandName}*\n`;
        commandCount++;
      }

      menuText += `╰──────────────────☉\n\n`;
    }

    menuText += `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    await client.sendMessage(m.chat, {
      text: menuText,
      contextInfo: {
        externalAdReply: {
          showAdAttribution: false,
          title: `Toxic-MD WA bot`,
          body: `©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
          thumbnail: pict,
          sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m });
  }
};