const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'h', 'list'],
  description: 'Displays the bot command menu with a voice note',
  run: async (context) => {
    const { client, m, totalCommands, mode, prefix, pict, botname } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\nBot’s down, no botname found! Yell at the dev, slacker.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Validate m.sender
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Invalid m.sender: ${JSON.stringify(m.sender)}`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nCan’t read your number, genius! Try again.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const userNumber = m.sender.split('@')[0];

      // Handle extra text
      if (context.text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\nNo extra nonsense needed, @${userNumber}! Just use ${prefix}menu, you slacker. 😈\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
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
        if (hour >= 5 && hour < 12) return 'Good Morning, early riser! 🌞';
        if (hour >= 12 && hour < 18) return 'Good Afternoon, champ! 🌟';
        if (hour >= 18 && hour < 22) return 'Good Evening, night crawler! 🌙';
        return 'Good Night, moonwalker! 🌌';
      };

      // Build menu
      let menuText = `◈━━━━━━━━━━━━━━━━◈\n*Welcome to ${botname}!* 🌟\n\n`;
      menuText += `${getGreeting()}, @${userNumber}!\n`;
      menuText += `Explore ${totalCommands} commands with *${prefix}* (e.g., *${prefix}video music*).\n`;
      menuText += `Don’t mess it up! 😈\n`;
      menuText += `\n*📖 Command Menu*\n`;

      for (const category of categories) {
        const categoryPath = path.join(__dirname, '..', 'Cmds', category.name);
        let commands = [];

        // Check if category folder exists
        try {
          if (fs.existsSync(categoryPath)) {
            commands = fs.readdirSync(categoryPath)
              .filter(file => file.endsWith('.js'))
              .map(file => {
                const commandName = file.replace('.js', '');
                const commandModule = require(path.join(categoryPath, file));
                return {
                  name: commandName,
                  description: commandModule.description || 'No description available'
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
          }
        } catch (error) {
          console.error(`Error reading category ${category.name}: ${error.message}`);
          continue;
        }

        if (commands.length === 0) continue;

        menuText += `\n${category.emoji} *${category.name}*\n`;
        for (const cmd of commands) {
          menuText += `  • ${prefix}${cmd.name}: ${cmd.description}\n`;
        }
      }

      menuText += `\n◈━━━━━━━━━━━━━━━━◈\n`;
      menuText += `Powered by *${botname}* 🗿\n`;

      // Send menu with contextInfo
      await client.sendMessage(m.chat, {
        text: menuText,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `Hey, @${userNumber}! Ready to rock ${botname}?`,
            body: `Use ${prefix}menu to explore commands!`,
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
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\nNo voice note today, @${userNumber}! Menu’s still here, so don’t whine. 😈\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
      }

    } catch (error) {
      console.error(`Menu command fucked up: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\nSomething broke the menu, @${userNumber}! Try again, you slacker.\nCheck https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`, { mentions: [m.sender] });
    }
  }
};