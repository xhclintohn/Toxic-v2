const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
  const { client, m, prefix } = context;

  const toFancyFont = (text, isUpperCase = false) => {
    const fonts = {
      'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
      'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
      'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
      'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
    };
    return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
      .split('')
      .map(char => fonts[char] || char)
      .join('');
  };

  try {
    const possibleAudioPaths = [
      path.join(__dirname, 'xh_clinton', 'bot.mp3'),
      path.join(process.cwd(), 'xh_clinton', 'bot.mp3'),
      path.join(__dirname, '..', 'xh_clinton', 'bot.mp3')
    ];

    let audioPath = null;
    for (const possiblePath of possibleAudioPaths) {
      if (fs.existsSync(possiblePath)) {
        audioPath = possiblePath;
        break;
      }
    }

    if (!audioPath) {
      console.error('❌ Audio file not found at any paths:', possibleAudioPaths);
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, where the fuck is bot.mp3? File’s missing, moron. 😡`
      }, { quoted: m });
    }

    console.log(`✅ Found audio at ${audioPath}`);
    // Send audio as voice note
    await client.sendMessage(m.chat, {
      audio: { url: audioPath },
      ptt: true,
      mimetype: 'audio/mpeg',
      fileName: 'bot.mp3'
    }, { quoted: m });

    // Send follow-up text with .repo button
    const repoText = `◈━━━━━━━━━━━━━━━━◈\n│❒ Hit the button below to view repo, ${m.pushName}! 😈\n◈━━━━━━━━━━━━━━━━◈`;
    await client.sendMessage(m.chat, {
      text: repoText,
      footer: `TPσɯҽɾҽԃ Ⴆყ Toxic-MD`,
      buttons: [
        { buttonId: `${prefix}repo`, buttonText: { displayText: `📖 ${toFancyFont('REPO')}` }, type: 1 }
      ],
      headerType: 1,
      viewOnce: true
    }, { quoted: m });

  } catch (error) {
    console.error('Error in bot command:', error);
    await client.sendMessage(m.chat, {
      text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit went sideways, ${m.pushName}. Can’t send bot.mp3. Try again later, loser. 😒`
    }, { quoted: m });
  }
};