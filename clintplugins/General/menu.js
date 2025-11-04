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
        
        const buttons = [
          {
            buttonId: `${effectivePrefix}fullmenu`,
            buttonText: { displayText: '𝐅𝐮𝐥𝐥𝐌𝐞𝐧𝐮' }
          },
          {
            buttonId: `${effectivePrefix}dev`,
            buttonText: { displayText: '𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫' }
          },
          {
            buttonId: `${effectivePrefix}ping`,
            buttonText: { displayText: '𝐏𝐢𝐧𝐠' }
          },
          {
            buttonId: `${effectivePrefix}repo`,
            buttonText: { displayText: '𝐑𝐞𝐩𝐨' }
          }
        ];

        const buttonMessage = {
          image: imageBuffer,
          caption: `Welcome to ${botname}!\nPlease select an option below:`,
          footer: `Pσɯҽɾԃ Ⴆý Tσxιƈ-ɱԃȥ`,
          buttons: buttons,
          headerType: 4,
          contextInfo: {
            mentionedJid: [m.sender],
            externalAdReply: {
              title: ownername,
              body: '',
              thumbnailUrl: "https://qu.ax/XxQwp.jpg",
              sourceUrl: `https://toxicmd.site`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          },
        };

        await sock.sendMessage(m.chat, buttonMessage, { quoted: m });
      } catch (error) {
        console.error('Error processing image:', error);
        await sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername);
      }
    } else {
      console.error('Image "toxic.jpg" not found. Checked paths:', possibleImagePaths);
      await sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername);
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
async function sendTextOnlyMenu(sock, m, botname, effectivePrefix, ownername) {
  const textMenu = `
╭───「 *${botname}* 」───
│ 
│ Hello *${m.pushName}*! 👋
│ 
│ *Available Commands:*
│ 
│ 🔘 *${effectivePrefix}fullmenu* - Full command list
│ 🔘 *${effectivePrefix}dev* - Developer info
│ 🔘 *${effectivePrefix}ping* - Check bot speed
│ 🔘 *${effectivePrefix}repo* - Bot repository
│
│ *Owner:* ${ownername}
╰─────────────────
  `.trim();

  await sock.sendMessage(m.chat, { text: textMenu }, { quoted: m });
}