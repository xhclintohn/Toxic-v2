const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the bot command menu with a voice note',
  run: async (context) => {
    const { client, m, totalCommands, prefix, pict, botname } = context;

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
        { name: 'General', emoji: '📜', commands: ['ping', 'menu'] },
        { name: 'Settings', emoji: '🛠️', commands: ['settings'] },
        { name: 'Owner', emoji: '👑', commands: [] },
        { name: 'Heroku', emoji: '☁️', commands: [] },
        { name: 'Wa-Privacy', emoji: '🔒', commands: [] },
        { name: 'Groups', emoji: '👥', commands: ['del'] },
        { name: 'AI', emoji: '🧠', commands: [] },
        { name: 'Media', emoji: '🎬', commands: ['video'] },
        { name: 'Editting', emoji: '✂️', commands: [] },
        { name: 'Logo', emoji: '🎨', commands: [] },
        { name: '+18', emoji: '🔞', commands: ['xvideo'] },
        { name: 'Utils', emoji: '🔧', commands: ['gaycheck'] }
      ];

      const getGreeting = () => {
        const hour = DateTime.now().setZone('Africa/Nairobi').hour;
        if (hour >= 5 && hour < 12) return 'Good Morning, early riser! 🌞';
        if (hour >= 12 && hour < 18) return 'Good Afternoon, champ! 🌟';
        if (hour >= 18 && hour < 22) return 'Good Evening, night crawler! 🌙';
        return 'Good Night, moonwalker! 🌌';
      };

      // Load commands from Cmds folder
      const cmdsPath = path.join(__dirname, '..', 'Cmds');
      let allCommands = [];

      try {
        if (fs.existsSync(cmdsPath)) {
          console.log(`Scanning Cmds folder: ${cmdsPath}`);
          allCommands = fs.readdirSync(cmdsPath)
            .filter(file => file.endsWith('.js'))
            .map(file => {
              try {
                const commandModule = require(path.join(cmdsPath, file));
                const commandName = file.replace('.js', '');
                console.log(`Loaded command: ${commandName}`);
                return {
                  name: commandName,
                  description: commandModule.description || 'No description available'
                };
              } catch (error) {
                console.error(`Error loading command ${file}: ${error.message}`);
                return null;
              }
            })
            .filter(cmd => cmd !== null)
            .sort((a, b) => a.name.localeCompare(b.name));
        } else {
          console.error(`Cmds folder not found at: ${cmdsPath}`);
        }
      } catch (error) {
        console.error(`Error scanning Cmds folder: ${error.message}`);
      }

      // Build menu
      let menuText = `◈━━━━━━━━━━━━━━━━◈\n*Welcome to ${botname}!* 🌟\n\n`;
      menuText += `${getGreeting()}, @${userNumber}!\n`;
      menuText += `Explore ${totalCommands || allCommands.length} commands with *${prefix}* (e.g., *${prefix}video music*).\n`;
      menuText += `Don’t mess it up! 😈\n`;
      menuText += `\n*📖 Command Menu*\n`;

      // Map commands to categories
      for (const category of categories) {
        let commands = [];

        // Include predefined commands
        commands = category.commands
          .map(cmdName => {
            const cmd = allCommands.find(c => c.name === cmdName);
            return cmd ? { name: cmd.name, description: cmd.description } : { name: cmdName, description: 'No description available' };
          });

        // Add commands from Cmds folder that match category
        const folderPath = path.join(cmdsPath, category.name);
        if (fs.existsSync(folderPath)) {
          try {
            const folderCommands = fs.readdirSync(folderPath)
              .filter(file => file.endsWith('.js'))
              .map(file => {
                const commandName = file.replace('.js', '');
                const commandModule = require(path.join(folderPath, file));
                console.log(`Loaded ${category.name} command: ${commandName}`);
                return {
                  name: commandName,
                  description: commandModule.description || 'No description available'
                };
              });
            commands = [...commands, ...folderCommands];
          } catch (error) {
            console.error(`Error reading category folder ${category.name}: ${error.message}`);
          }
        }

        // Sort and deduplicate commands
        commands = [...new Set(commands.map(c => c.name))].map(name => commands.find(c => c.name === name))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (commands.length === 0) {
          console.log(`No commands for category: ${category.name}`);
          continue;
        }

        menuText += `\n${category.emoji} *${category.name}*\n`;
        for (const cmd of commands) {
          menuText += `  • ${prefix}${cmd.name}: ${cmd.description}\n`;
        }
      }

      // Fallback if no commands loaded
      if (!menuText.includes('•')) {
        menuText += `\nNo commands loaded, you slacker! Try these:\n`;
        menuText += `  • ${prefix}ping: Check bot response time\n`;
        menuText += `  • ${prefix}video: Download a YouTube video\n`;
        menuText += `  • ${prefix}gaycheck: Test your vibe 😈\n`;
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