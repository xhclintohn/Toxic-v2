const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts a group status message with text, image, video, or audio like a boss 😎',
  run: async (context) => {
    const { client, m, prefix, isBotAdmin, IsGroup, botname } = context;

    try {
      // Validate botname
      if (!botname) {
        console.error('Toxic-MD: Botname not set in context');
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked, @${m.sender.split('@')[0]}! 😤 No botname set. Yell at the dev, dipshit! 💀\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Validate sender JID
      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        console.error(`Toxic-MD: Invalid sender JID: ${JSON.stringify(m.sender)}`);
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender ? m.sender.split('@')[0] : 'unknown'}, your ID’s fucked! 😤 Can’t process this crap. Fix it! 💀\n┗━━━━━━━━━━━━━━━┛`
        );
      }

      // Validate if the command is used in a group
      if (!IsGroup) {
        console.log(`Toxic-MD: Gstatus command attempted in non-group chat by ${m.sender}`);
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}, you dumb fuck! 😈 This ain’t a group! Use ${prefix}gstatus in a group, moron! 🖕\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Validate if the bot is an admin
      if (!isBotAdmin) {
        console.log(`Toxic-MD: Bot is not admin in ${m.chat}`);
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ OI, @${m.sender.split('@')[0]}! 😤 I ain’t admin, so I can’t post status! Make me admin or fuck off! 🚫\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        console.error('Toxic-MD: Settings not found');
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 Couldn’t load settings, you dumb fuck. Fix this crap! 💀\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Fancy font function
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

      // Get the quoted message or the current message
      const quoted = m.quoted ? m.quoted : m;
      const mime = (quoted.msg || quoted).mimetype || '';
      const caption = m.body.replace(new RegExp(`^${prefix}(gstatus|groupstatus|gs)\\s*`, 'i'), '').trim();

      // Validate input
      if (!mime && !caption) {
        console.log(`Toxic-MD: No media or text provided for gstatus by ${m.sender}`);
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Brain-dead moron, @${m.sender.split('@')[0]}! 😡 Reply to an image, video, or audio, or add some text! Try ${prefix}gstatus Yo, check this out!, idiot! 🖕\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Get group participants for statusJidList
      let groupMetadata;
      try {
        groupMetadata = await client.groupMetadata(m.chat);
      } catch (e) {
        console.error(`Toxic-MD: Error fetching group metadata: ${e.stack}`);
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 Couldn’t get group data: ${e.message}. Fix this crap! 💀\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Ensure statusJidList contains valid string JIDs
      const statusJidList = groupMetadata.participants
        .map(p => client.decodeJid(p.id))
        .filter(jid => typeof jid === 'string' && jid.includes('@s.whatsapp.net'));

      if (!statusJidList.length) {
        console.error(`Toxic-MD: No valid JIDs found in group ${m.chat}`);
        return m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 No valid group members found. This group’s fucked! 💀\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

      // Handle different media types or text
      if (/image/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage('status@broadcast', {
          image: buffer,
          caption: caption || `Posted by *${toFancyFont(botname)}*`
        }, { statusJidList });
        await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Image status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just owned the group story! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      } else if (/video/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage('status@broadcast', {
          video: buffer,
          caption: caption || `Posted by *${toFancyFont(botname)}*`
        }, { statusJidList });
        await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Video status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just dropped some heat! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      } else if (/audio/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage('status@broadcast', {
          audio: buffer,
          mimetype: 'audio/mp4',
          ptt: false
        }, { statusJidList });
        await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Audio status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just blasted the group! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      } else if (caption) {
        await client.sendMessage('status@broadcast', {
          text: caption
        }, { statusJidList });
        await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n│❒ Text status posted, @${m.sender.split('@')[0]}! 😈 *${toFancyFont(botname)}* just told the group what’s up! 🎗️\n┗━━━━━━━━━━━━━━━┛`,
          { mentions: [m.sender] }
        );
      }

    } catch (error) {
      console.error(`Toxic-MD: Gstatus command error: ${error.stack}`);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, @${m.sender.split('@')[0]}! 😤 Couldn’t post status: ${error.message}. Try later, incompetent fuck! 💀\n┗━━━━━━━━━━━━━━━┛`,
        { mentions: [m.sender] }
      );
    }
  }
};