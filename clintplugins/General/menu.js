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

    // Define your button structure like you did with `ReplyImageX`
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
        buttonId: `${prefix}repo`,
        buttonText: { displayText: '𝐑𝐞𝐩𝐨' }
      }
    ];

    // Define the message
    const buttonMessage = {
      image: "https://qu.ax/XxQwp.jpg", // Thumbnail image for the button message
      caption: `Welcome to ${botname}!\nPlease select an option below:`,
      footer: `Pσɯҽɾԃ Ⴆý Tσxιƈ-ɱԃȥ`,
      buttons: buttons,
      headerType: 4, // This will include an image with the button message
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
      await sock.sendMessage(m.chat, {
        audio: { url: audioPath },
        ptt: true,
        mimetype: 'audio/mpeg',
        fileName: 'menu.mp3',
      }, { quoted: m });
    }
  },
};