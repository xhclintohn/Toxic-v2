const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the Toxic-MD command menu with interactive buttons',
  run: async (context) => {
    const { client: sock, m, mode, pict, botname, text, prefix } = context;

    if (text) {
      await sock.sendMessage(
        m.chat,
        {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, what's with the extra bullshit? Just say *${prefix}menu*, moron.\n┗━━━━━━━━━━━━━━━┛`,
        },
        { quoted: m, ad: true }
      );
      return;
    }

    const settings = await getSettings();
    const effectivePrefix = settings.prefix || '.'; 
    const ownername = "xh_clinton";

    // Fancy font converter
    const toFancyFont = (text, isUpperCase = false) => {
      const fonts = {
        A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃', I: '𝙄', J: '𝙅', K: '𝙆', L: '𝙇', M: '𝙈',
        N: '𝙉', O: '𝙊', P: '𝙋', Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑', W: '𝙒', X: '𝙓', Y: '𝙔', Z: '𝙕',
        a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢',
        n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭', y: '𝙮', z: '𝙯',
      };
      return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
        .split('')
        .map((char) => fonts[char] || char)
        .join('');
    };

    // Menu text
    const menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, B*tches!* 😈\n\n` +
      `🤖 *Bσƚ*: ${botname} (bow down)\n` +
      `🔣 *Pɾҽϝιx*: ${effectivePrefix} (learn it, dumbass)\n` +
      `🌐 *Mσԃҽ*: ${mode} (deal with it)\n` +
      `\n◈━━━━━━━━━━━━━━━━◈\n\n` +
      `*Select an option Below, Loser.* 😈`;

    // Try multiple possible locations for toxic.jpg
    const possibleImagePaths = [
      path.resolve(__dirname, '../toxic.jpg'),
      path.resolve(__dirname, '../../toxic.jpg'),
      path.resolve(process.cwd(), 'toxic.jpg'),
      path.join(__dirname, '../toxic.jpg'),
      path.join(__dirname, '../../toxic.jpg'),
      path.join(process.cwd(), 'toxic.jpg'),
      '/app/toxic.jpg', // Direct path from your logs
    ];

    let imagePath = null;
    for (const possiblePath of possibleImagePaths) {
      if (fs.existsSync(possiblePath)) {
        imagePath = possiblePath;
        console.log('Found image at:', imagePath);
        break;
      }
    }

    if (imagePath) {
      try {
        // Read the image file directly
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Interactive list message with sections
        const listMessage = {
          title: toFancyFont(`${botname} MENU`, true),
          text: menuText,
          buttonText: "CLICK HERE TO SELECT",
          footer: `Pσɯҽɾԃ Ⴆý Tσxιƈ-ɱԃȥ`,
          image: imageBuffer,
          sections: [
            {
              title: toFancyFont("MAIN OPTIONS", true),
              rows: [
                {
                  title: toFancyFont("FULL MENU"),
                  description: "View all available commands",
                  rowId: `${effectivePrefix}fullmenu`
                },
                {
                  title: toFancyFont("DEVELOPER INFO"),
                  description: "About the bot creator",
                  rowId: `${effectivePrefix}dev`
                },
                {
                  title: toFancyFont("BOT SPEED"),
                  description: "Check bot response time",
                  rowId: `${effectivePrefix}ping`
                },
                {
                  title: toFancyFont("REPOSITORY"),
                  description: "Get the bot source code",
                  rowId: `${effectivePrefix}repo`
                }
              ]
            },
            {
              title: toFancyFont("QUICK ACTIONS", true),
              rows: [
                {
                  title: toFancyFont("ABOUT BOT"),
                  description: "Learn about this bot",
                  rowId: `${effectivePrefix}about`
                },
                {
                  title: toFancyFont("SUPPORT GROUP"),
                  description: "Join our community",
                  rowId: `${effectivePrefix}support`
                },
                {
                  title: toFancyFont("DONATE"),
                  description: "Support the developer",
                  rowId: `${effectivePrefix}donate`
                },
                {
                  title: toFancyFont("STATUS"),
                  description: "Check bot status",
                  rowId: `${effectivePrefix}status`
                }
              ]
            }
          ]
        };

        await sock.sendMessage(m.chat, listMessage, { quoted: m });
      } catch (error) {
        console.error('Error processing image:', error);
        await sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername, toFancyFont, menuText);
      }
    } else {
      console.error('Image "toxic.jpg" not found. Checked paths:', possibleImagePaths);
      await sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername, toFancyFont, menuText);
    }

    // === AUDIO ===
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
      try {
        const audioBuffer = fs.readFileSync(audioPath);
        await sock.sendMessage(m.chat, {
          audio: audioBuffer,
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'menu.mp3',
        }, { quoted: m });
      } catch (audioError) {
        console.error('Error sending audio:', audioError);
      }
    }
  },
};

// Fallback function for text-only menu
async function sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername, toFancyFont, menuText) {
  const textMenu = `
╭───「 *${toFancyFont(botname)}* 」───
│ 
│ ${menuText}
│ 
│ *Quick Commands:*
│ 
│ 📖 *${effectivePrefix}fullmenu* - Full command list
│ 👨‍💻 *${effectivePrefix}dev* - Developer info  
│ 🏓 *${effectivePrefix}ping* - Check bot speed
│ 📂 *${effectivePrefix}repo* - Bot repository
│ ℹ️ *${effectivePrefix}about* - About this bot
│ 👥 *${effectivePrefix}support* - Support group
│ 💰 *${effectivePrefix}donate* - Donate to dev
│ 📊 *${effectivePrefix}status* - Bot status
│
│ *Owner:* ${ownername}
╰─────────────────
  `.trim();

  await sock.sendMessage(m.chat, { text: textMenu }, { quoted: m });
}