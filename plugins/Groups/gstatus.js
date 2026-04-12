const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts a group status with text, image, video, or audio.',
  run: async (context) => {
    const { client, m, prefix, IsGroup, botname, settings } = context;
    const fq = getFakeQuoted(m);

    const formatMsg = (text) => `╭───(    TOXIC-MD    )───\n├ \n├ ${text}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    try {
      if (!botname) {
        return client.sendText(m.chat, formatMsg(`Bot name is not set. Configure it before using this command.`), m);
      }

      if (!m.sender || typeof m.sender !== 'string' || !m.sender.includes('@s.whatsapp.net')) {
        return client.sendText(m.chat, formatMsg(`Could not identify your WhatsApp ID. Try again.`), m);
      }

      if (!IsGroup) {
        return client.sendText(m.chat, formatMsg(`This command can only be used in group chats.`), m);
      }

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      const quoted = m.quoted ? m.quoted : m;
      const mime = (quoted.msg || quoted).mimetype || '';
      const caption = m.body
        .replace(new RegExp(`^${prefix}(gstatus|groupstatus|gs)\\s*`, 'i'), '')
        .trim();

      if (!/image|video|audio/.test(mime) && !caption) {
        return client.sendText(
          m.chat,
          formatMsg(`Reply to an image, video, audio, or include text.\nExample: ${prefix}gstatus Check out this update!`),
          m
        );
      }

      const defaultCaption = `Group status Posted By Toxic-MD\n\nxD\n🪽`;

      if (/image/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            image: buffer,
            caption: caption || defaultCaption
          }
        });
        await client.sendText(m.chat, formatMsg(`Image status has been posted successfully.`), m);
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      } else if (/video/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            video: buffer,
            caption: caption || defaultCaption
          }
        });
        await client.sendText(m.chat, formatMsg(`Video status has been posted successfully.`), m);
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      } else if (/audio/.test(mime)) {
        const buffer = await client.downloadMediaMessage(quoted);
        await client.sendMessage(m.chat, {
          groupStatusMessage: {
            audio: buffer,
            mimetype: 'audio/mp4'
          }
        });
        await client.sendText(m.chat, formatMsg(`Audio status has been posted successfully.`), m);
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      } else if (caption) {
        await client.sendMessage(m.chat, {
          groupStatusMessage: { text: caption }
        });
        await client.sendText(m.chat, formatMsg(`Text status has been posted successfully.`), m);
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      }

    } catch (error) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendText(
        m.chat,
        formatMsg(`An error occurred while posting status:\n${error.message}`),
        m
      );
    }
  }
};