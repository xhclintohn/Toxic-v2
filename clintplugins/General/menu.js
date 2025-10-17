const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'list'],
  description: 'Displays the Toxic-MD command menu with interactive buttons',
  run: async (context) => {
    const { client, m, mode, pict, botname, text, prefix } = context;

    if (text) {
      await client.sendMessage(
        m.chat,
        {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, what's with the extra bullshit? Just say *${prefix}menu*, moron. 🖕\n┗━━━━━━━━━━━━━━━┛`,
        },
        { quoted: m, ad: true }
      );
      return;
    }

    const settings = await getSettings();
    const effectivePrefix = settings.prefix || '.'; // Dynamic prefix from database

    // Fancy font converter
    const toFancyFont = (text, isUpperCase = false) => {
      const fonts = {
        A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃', I: '𝙄', J: '𝙅', K: '𝙆', L: '𝙇', M: '𝙈',
        N: '𝙉', O: '𝙊', P: '𝙋', Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑', W: '𝙒', X: '𝙓', Y: '𝙔', Z: '𝙕',
        a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢',
        n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭', y: '𝙯', z: '𝙯',
      };
      return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
        .split('')
        .map((char) => fonts[char] || char)
        .join('');
    };

    // Menu text with Toxic-MD flair
    const menuText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Welcome to ${botname}, B*tches!* 😈\n\n` +
      `🤖 *Bσƚ*: ${botname} (bow down)\n` +
      `🔣 *Pɾҽϝιx*: ${effectivePrefix} (learn it, dumbass)\n` +
      `🌐 *Mσԃҽ*: ${mode} (deal with it)\n` +
      `\n◈━━━━━━━━━━━━━━━━◈\n\n` +
      `*Select an option Below, Loser.* 😈`;

    // Simple list message with buttons
    const msg = generateWAMessageFromContent(
      m.chat,
      {
        listMessage: {
          title: `${botname} Menu`,
          description: menuText,
          buttonText: 'VIEW OPTIONS',
          footerText: `Pσɯҽɾҽԃ Ⴆყ ${botname}`,
          listType: 1, // Single select list
          sections: [
            {
              title: '🔥 CORE COMMANDS',
              rows: [
                { title: '📜 FULL MENU', description: 'Show all commands', rowId: `.fullmenu` },
                { title: '⚠️ DEV', description: "Send developer's contact", rowId: `${effectivePrefix}dev` },
              ],
            },
            {
              title: 'ℹ BOT INFO',
              rows: [
                { title: '🔥 PING', description: 'Check bot speed', rowId: `${effectivePrefix}ping` },
                { title: '💯 REPO', description: 'Get bot repository', rowId: `${effectivePrefix}repo` },
              ],
            },
            {
              title: '🔗 EXTERNAL LINK',
              rows: [
                { title: 'GitHub Repo', description: 'Visit Toxic-MD GitHub', rowId: 'cta_url:https://github.com/xhclintohn/Toxic-MD' },
              ],
            },
          ],
        },
        contextInfo: {
          externalAdReply: {
            title: `${botname}`,
            body: `Yo, ${m.pushName}! Ready to fuck shit up?`,
            mediaType: 1,
            thumbnail: pict,
            mediaUrl: '',
            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
            showAdAttribution: false,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: m }
    );

    await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

    // Audio message logic
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
      await client.sendMessage(
        m.chat,
        {
          audio: { url: audioPath },
          ptt: true,
          mimetype: 'audio/mpeg',
          fileName: 'menu.mp3',
        },
        { quoted: m }
      );
    }
  },
};