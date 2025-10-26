const { getSettings } = require('../../Database/config');

module.exports = {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts a group status message with text, image, video, or audio like a boss 😎',
  run: async (context) => {
    const { client, m, prefix, isBotAdmin, IsGroup } = context;

    try {
      // Validate if the command is used in a group
      if (!IsGroup) {
        return m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ Yo, @${m.sender.split('@')[0]}! This command only works in groups, dumbass.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`, { mentions: [m.sender] });
      }

      // Validate if the bot is an admin
      if (!isBotAdmin) {
        return m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ I'm not an admin, @${m.sender.split('@')[0]}! Tell the group to promote me, you slacker.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`, { mentions: [m.sender] });
      }

      // Retrieve settings to get the current prefix
      const settings = await getSettings();
      if (!settings) {
        return m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ Error: Couldn't load settings, you dumb fuck.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`);
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

      // Handle different media types or text
      if (/image/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage('status@broadcast', {
          image: buffer,
          caption: caption || ''
        }, { statusJidList: [m.chat] });
        await m.react('✅');
      } else if (/video/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage('status@broadcast', {
          video: buffer,
          caption: caption || ''
        }, { statusJidList: [m.chat] });
        await m.react('✅');
      } else if (/audio/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage('status@broadcast', {
          audio: buffer,
          mimetype: 'audio/mp4',
          ptt: false
        }, { statusJidList: [m.chat] });
        await m.react('✅');
      } else if (caption) {
        await client.sendMessage('status@broadcast', {
          text: caption
        }, { statusJidList: [m.chat] });
        await m.react('✅');
      } else {
        await m.reply(`◎━━━━━━━━━━━━━━━━◎\n│❒ Yo, @${m.sender.split('@')[0]}! Reply to an image, video, or audio, or add some text, you lazy fuck.\n│❒ Example: ${prefix}gstatus (reply to media) Yo, check this out!\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`, { mentions: [m.sender] });
      }

    } catch (error) {
      console.error(`Gstatus command fucked up: ${error.stack}`);
      await client.sendMessage(m.chat, {
        text: `◎━━━━━━━━━━━━━━━━◎\n│❒ Gstatus is fucked, @${m.sender.split('@')[0]}! Try again, you slacker.\nCheck https://github.com/xhclintohn/Toxic-MD\n◎━━━━━━━━━━━━━━━━◎`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};