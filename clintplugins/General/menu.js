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

    // Menu text🗿
    const menuText = `( 💬 ) - Hello, ${m.pushName || "you nameless fuck"}...

You're using *${botname}* - not that you deserve it.

        *- 計さ INFORMATION BOT*
        
 ⌬ Botname :
  ${botname} (bow down)
  
 ⌬ Owner : 
 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 (my creator, respect him)
 
 ⌬ Prefix : 
 ${effectivePrefix} (don't forget it, idiot)
 
 ⌬ Mode : 
 ${mode} (deal with it)
 
 ⌬ Runtime: 
 ${runtime(process.uptime())} (longer than your attention span)

ɴᴏᴡ ꜱᴛᴏᴘ ꜱᴛᴀʀɪɴɢ ᴀɴᴅ ᴘɪᴄᴋ ᴀ ꜰᴜᴄᴋɪɴɢ ᴏᴘᴛɪᴏɴ ᴀʟʀᴇᴀᴅʏ (ʙᴜᴛᴛᴏɴ ʙᴇʟᴏᴡ).`;

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
       
        const imageBuffer = fs.readFileSync(imagePath);

        const buttonMessage = {
          image: imageBuffer,
          caption: menuText,
          footer: 'Pσɯҽɾԃ Ⴆý Tσxιƈ-ɱԃȥ',
          headerType: 4,
          contextInfo: {
            mentionedJid: [m.sender]
          }
        };

        const nativeFlowButton = {
          buttonId: 'toxicmenu',
          buttonText: { displayText: 'Pick Your Poison ☇' },
          type: 4,
          nativeFlowInfo: {
            name: 'single_select',
            paramsJson: JSON.stringify({
              title: 'ᴄʜᴏᴏꜱᴇ ᴀ ʙᴜᴛᴛᴏɴ',
              sections: [
                {
                  title: '⌜ BASIC COMMANDS ☣️ ⌟',
                  rows: [
                    {
                      header: '𝐅𝐮𝐥𝐥𝐌𝐞𝐧𝐮',
                      title: 'Full Command List',
                      description: 'All commands because you can\'t remember shit',
                      id: `${effectivePrefix}fullmenu`
                    },
                    {
                      header: '𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫',
                      title: 'Bot Creator',
                      description: 'Send the contact of the developer ',
                      id: `${effectivePrefix}dev`
                    },
                    {
                      header: '𝐏𝐢𝐧𝐠',
                      title: 'Check Bot Speed',
                      description: 'See how fast I respond to your dumb ass',
                      id: `${effectivePrefix}ping`
                    },
                    {
                      header: '𝐑𝐞𝐩𝐨',
                      title: 'Source Code',
                      description: 'Get the code, not that you\'ll understand it',
                      id: `${effectivePrefix}repo`
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

*Available Commands (you better remember these):*

*${effectivePrefix}fullmenu* - All commands because your memory is trash
*${effectivePrefix}dev* - My creator, worship him
*${effectivePrefix}ping* - Check if I give a fuck about responding
*${effectivePrefix}repo* - The code that makes me better than you

Now stop bothering me and pick one.
  `.trim();

  await sock.sendMessage(m.chat, { text: textMenu }, { quoted: m });
}