const { getSettings } = require('../../Database/config');

/**
 * Posts a group status message with text, image, video, or audio.
 * @module gstatus
 */
module.exports = {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts a group status with text, image, video, or audio like a boss 😎',
  run: async (context) => {
    const { client, m, prefix, isBotAdmin, IsGroup, botname } = context;

    try {
      /**
       * Validates that the botname is set in the context.
       */
      if (!botname) {
        return client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked, @${m.sender.split('@')[0]}! 😤 No botname set. Yell at the dev, dipshit! 💀\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      }

      /**
       * Validates that the sender JID is a valid WhatsApp JID.
       */
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        return client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName || 'unknown'}, your ID’s fucked! 😤 Can’t process this crap. Fix it! 💀\n┗━━━━━━━━━━━━━━━┛`,
          m
        );
      }

      /**
       * Ensures the command is used in a group chat.
       */
      if (!IsGroup) {
        return client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}, you dumb fuck! 😈 This ain’t a group! Use ${prefix}gstatus in a group, moron! 🖕\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      }

      /**
       * Verifies that the bot has admin privileges in the group.
       */
      if (!isBotAdmin) {
        return client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ OI, @${m.sender.split('@')[0]}! 😤 I ain’t admin, so I can’t post status! Make me admin or fuck off! 🚫\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      }

      /**
       * Loads settings to retrieve the current prefix.
       */
      const settings = await getSettings();
      if (!settings) {
        return client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 Couldn’t load settings, you dumb fuck. Fix this crap! 💀\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      }

      /**
       * Converts text to a fancy font for display.
       * @param {string} text - The text to convert.
       * @param {boolean} [isUpperCase=false] - Whether to convert to uppercase.
       * @returns {string} The text in fancy font.
       */
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

      /**
       * Processes the quoted message or current message and extracts caption.
       */
      const quoted = m.quoted ? m.quoted : m;
      const mime = (quoted.msg || quoted).mimetype || '';
      const caption = m.body.replace(new RegExp(`^${prefix}(gstatus|groupstatus|gs)\\s*`, 'i'), '').trim();

      /**
       * Validates that a valid media type or text is provided.
       */
      if (!/image|video|audio/.test(mime) && !caption) {
        return client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Brain-dead moron, @${m.sender.split('@')[0]}! 😡 Reply to an image, video, audio, or add text! Try ${prefix}gstatus (reply to media) Yo, check this out!, idiot! 🖕\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      }

      /**
       * Posts the status based on media type or text.
       */
      if (/image/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            image: buffer,
            caption: caption || `Posted by *${toFancyFont(botname)}*`
          }
        });
        await client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Image status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just owned the group story! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      } else if (/video/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            video: buffer,
            caption: caption || `Posted by *${toFancyFont(botname)}*`
          }
        });
        await client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Video status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just dropped some heat! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      } else if (/audio/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            audio: buffer,
            mimetype: 'audio/mp4'
          }
        });
        await client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Audio status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just blasted the group! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      } else if (caption) {
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            text: caption
          }
        });
        await client.sendText(m.chat, 
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Text status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just told the group what’s up! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          m,
          { mentions: [m.sender] }
        );
      }

    } catch (error) {
      await client.sendText(m.chat, 
        `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 Couldn’t post status: ${error.message}. Try later, incompetent fuck! 💀\n┗━━━━━━━━━━━━━━━┛`,
        m,
        { mentions: [m.sender] }
      );
    }
  }
};