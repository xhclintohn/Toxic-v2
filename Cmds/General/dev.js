const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'dev',
  aliases: ['developer', 'contact'],
  description: 'Sends the developer’s contact with message and add options',
  run: async (context) => {
    const { client, m, pict, botname } = context;

    try {
      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Error: Couldn’t load settings, you dumb fuck.` }, { quoted: m });
        return;
      }

      const effectivePrefix = settings.prefix || ''; // Use empty string for prefixless mode

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

      const devContact = {
        phoneNumber: '+254112671344', // Replace with your actual phone number
        firstName: 'Toxic',
        lastName: 'Dev'
      };

      let contactText = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Meet the ${botname} Mastermind!* 💀\n\n`;
      contactText += `👤 *Name*: ${devContact.firstName} ${devContact.lastName}\n`;
      contactText += `📱 *Contact*: ${devContact.phoneNumber}\n`;
      contactText += `\n*Don’t waste my time, loser!* 😈\n`;
      contactText += `◈━━━━━━━━━━━━━━━━◈\n`;

      await client.sendMessage(m.chat, {
        contacts: {
          displayName: `${devContact.firstName} ${devContact.lastName}`,
          contacts: [{
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${devContact.firstName} ${devContact.lastName}\nTEL;TYPE=CELL:${devContact.phoneNumber}\nEND:VCARD`
          }]
        }
      }, { quoted: m });

      await client.sendMessage(m.chat, {
        text: contactText,
        footer: `TPσɯҽɾҽԃ Ⴆყ ${botname}`,
        buttons: [
          { buttonId: `${effectivePrefix}message_dev`, buttonText: { displayText: `💬 ${toFancyFont('MESSAGE')}` }, type: 1 },
          { buttonId: `${effectivePrefix}add_contact`, buttonText: { displayText: `➕ ${toFancyFont('ADD TO CONTACTS')}` }, type: 1 }
        ],
        headerType: 1,
        viewOnce: true,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `${botname}`,
            body: `Yo, ${m.pushName}! Don’t fuck this up.`,
            thumbnail: pict,
            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      }, { quoted: m });

    } catch (error) {
      console.error('Error sending developer contact:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, something fucked up the dev contact. Try again later, loser.\n\nPowered by *${botname}*`
      }, { quoted: m });
    }
  }
};