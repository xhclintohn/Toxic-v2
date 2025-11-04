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
    const menuText = `( 💬 ) - Hello, ${m.pushName || "No Name"}!
Welcome to ${botname},
I was created with the aim of helping my owner.

*- 計さ INFORMATION BOT*
 ⌬ Botname : ${botname}
 ⌬ Owner : ${ownername}
 ⌬ Version : 1.0.0
 ⌬ Prefix : ${effectivePrefix}
 ⌬ Mode : ${mode}
 ⌬ Runtime: ${runtime(process.uptime())}

( ! ) Please press the button below`;

    // Runtime function
    function runtime(seconds) {
      seconds = Math.floor(seconds);
      const days = Math.floor(seconds / (3600 * 24));
      const hours = Math.floor((seconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      const parts = [];
      if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
      if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
      if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
      if (secs > 0) parts.push(`${secs} second${secs > 1 ? 's' : ''}`);
      
      return parts.join(' ') || '0 seconds';
    }

    // Try multiple possible locations for toxic.jpg
    const possibleImagePaths = [
      path.resolve(__dirname, '../toxic.jpg'),
      path.resolve(__dirname, '../../toxic.jpg'),
      path.resolve(process.cwd(), 'toxic.jpg'),
      path.join(__dirname, '../toxic.jpg'),
      path.join(__dirname, '../../toxic.jpg'),
      path.join(process.cwd(), 'toxic.jpg'),
      '/app/toxic.jpg',
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
        
        const buttonMessage = {
          image: imageBuffer,
          caption: menuText,
          footer: 'Pσɯҽɾԃ Ⴆý Tσxιƈ-ɱԃȥ',
          headerType: 4,
          contextInfo: {
            forwardingScore: 99999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363322461279856@newsletter",
              serverMessageId: null,
              newsletterName: `🩸⃟༑⌁⃰𝐓͢𝐨𝐱𝐢𝐜-𝐌𝐃ͯ 𝐄͢𝐱𝐞𝐜𝐮͢𝐭𝐢𝐨𝐧 𝐕ͮ𝐚͢𝐮𝐥𝐭ཀ͜͡🦠️`
            },
            externalAdReply: {
              showAdAttribution: true,
              title: '𝗧𝗼𝘅𝗶𝗰-𝗠𝗗 𝗩𝟭',
              body: '𝗫𝗵_𝗖𝗹𝗶𝗻𝘁𝗼𝗻 𝗗𝗲𝘃',
              mediaType: 1,
              renderLargerThumbnail: false,
              thumbnail: imageBuffer,
              sourceUrl: 'https://www.youtube.com/@xh_clinton'
            },
            mentionedJid: [m.sender]
          },
          viewOnce: true
        };

        const nativeFlowButton = {
          buttonId: 'toxicmenu',
          buttonText: { displayText: 'Open Menu ☇' },
          type: 4,
          nativeFlowInfo: {
            name: 'single_select',
            paramsJson: JSON.stringify({
              title: 'Select ☇ Menu',
              sections: [
                {
                  title: '⌜𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐁𝐨𝐭🎭 ⌟',
                  rows: [
                    {
                      header: '𝐅𝐔𝐋𝐋 𝐌𝐄𝐍𝐔',
                      title: 'Full Menu',
                      description: 'Menampilkan semua command',
                      id: `${effectivePrefix}fullmenu`
                    },
                    {
                      header: '𝐃𝐄𝐕𝐄𝐋𝐎𝐏𝐄𝐑',
                      title: 'Developer',
                      description: 'Menampilkan developer bot',
                      id: `${effectivePrefix}dev`
                    },
                    {
                      header: '𝐏𝐈𝐍𝐆',
                      title: 'Ping Bot',
                      description: 'Check bot response time',
                      id: `${effectivePrefix}ping`
                    },
                    {
                      header: '𝐑𝐄𝐏𝐎',
                      title: 'Repository',
                      description: 'Get bot source code',
                      id: `${effectivePrefix}repo`
                    }
                  ]
                },
                {
                  title: '⌜ 𝐎𝐖𝐍𝐄𝐑 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒🦠 ⌟',
                  rows: [
                    {
                      header: '𝐎𝐖𝐍𝐄𝐑 𝐌𝐄𝐍𝐔',
                      title: 'Owner Menu',
                      description: 'Menampilkan owner commands',
                      id: `${effectivePrefix}owner`
                    },
                    {
                      header: '𝐁𝐎𝐓 𝐒𝐓𝐀𝐓𝐔𝐒',
                      title: 'Bot Status',
                      description: 'Check bot statistics',
                      id: `${effectivePrefix}status`
                    }
                  ]
                }
              ]
            })
          }
        };

        await sock.sendMessage(m.chat, {
          ...buttonMessage,
          buttons: [nativeFlowButton]
        }, { quoted: m });

      } catch (error) {
        console.error('Error processing image:', error);
        await sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername, menuText);
      }
    } else {
      console.error('Image "toxic.jpg" not found. Checked paths:', possibleImagePaths);
      await sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername, menuText);
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
async function sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername, menuText) {
  const textMenu = `
${menuText}

*Quick Commands:*

📖 *${effectivePrefix}fullmenu* - Full command list
👨‍💻 *${effectivePrefix}dev* - Developer info  
🏓 *${effectivePrefix}ping* - Check bot speed
📂 *${effectivePrefix}repo* - Bot repository
⚡ *${effectivePrefix}owner* - Owner commands
📊 *${effectivePrefix}status* - Bot status

*Owner:* ${ownername}
  `.trim();

  await sock.sendMessage(m.chat, { text: textMenu }, { quoted: m });
}