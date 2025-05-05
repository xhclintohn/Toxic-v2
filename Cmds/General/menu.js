const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays a fully styled bot command menu with buttons and a voice note',
  run: async (context) => {
    const { client, m, mode, pict, botname, text } = context;

    if (text) {
      return client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, just say ${settings.prefix}menu, no extra nonsense!` }, { quoted: m });
    }

    try {
      const settings = await getSettings();
      if (!settings) return;

      const effectivePrefix = settings.prefix || '';

      const buttonCommands = [
        { id: 'fullmenu', display: '🔥 𝙁𝙐𝙇𝙇𝙈𝙀𝙉𝙐' },
        { id: 'dev', display: '💀 𝘿𝙀𝙑' },
        { id: 'ping', display: '🏓 𝙋𝙄𝙉𝙂' },
        { id: 'uptime', display: '⏰ 𝙐𝙋𝙏𝙄𝙈𝙀' }
      ];

      const menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ 𝙏𝙤𝙭𝙞𝙘-𝙈𝘿 𝙈𝙀𝙉𝙐 😈\n\n`;
      menuText += `🤖 𝘽𝙤𝙩: ${botname}\n`;
      menuText += `🔣 𝙋𝙧𝙚𝙛𝙞𝙭: ${effectivePrefix || 'None'}\n`;
      menuText += `🌐 𝙈𝙤𝙙𝙚: ${mode}\n\n`;
      menuText += `◈━━━━━━━━━━━━━━━━◈\n\n`;
      menuText += `𝘾𝙝𝙤𝙤𝙨𝙚 𝙖𝙣 𝙤𝙥𝙩𝙞𝙤𝙣 𝙗𝙚𝙡𝙤𝙬!`;

      await client.sendMessage(m.chat, {
        text: menuText,
        footer: `𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 ${botname}`,
        buttons: buttonCommands.map(cmd => ({
          buttonId: `${effectivePrefix}${cmd.id}`,
          buttonText: { displayText: cmd.display },
          type: 1
        })),
        headerType: 1,
        viewOnce: true
      }, { quoted: m });

      const possibleAudioPaths = [
        path.join(__dirname, 'xh_clinton', 'menu.mp3'),
        path.join(process.cwd(), 'xh_clinton', 'menu.mp3'),
        path.join(__dirname, '..', 'xh_clinton', 'menu.mp3'),
      ];

      for (const possiblePath of possibleAudioPaths) {
        if (fs.existsSync(possiblePath)) {
          await client.sendMessage(m.chat, {
            audio: { url: possiblePath },
            ptt: true,
            mimetype: 'audio/mpeg',
            fileName: 'menu.mp3'
          }, { quoted: m });
          break;
        }
      }

    } catch {
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Something went wrong. Try again later.\n\n𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 *${botname}*`
      }, { quoted: m });
    }
  }
};