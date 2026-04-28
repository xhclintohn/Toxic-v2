import { getFakeQuoted } from '../../lib/fakeQuoted.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts media or text to a group. Use in a group or from DM with a group JID/link.',
  run: async (context) => {
    const { client, m, prefix, IsGroup } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    const fmt = (text) => `╭───(    TOXIC-MD    )───\n├ \n├ ${text}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    try {
      let targetGroupJid = m.chat;

      if (!IsGroup) {
        const rawArgs = m.body.trim().split(/\s+/);
        const input = rawArgs[1];

        if (!input) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
          return client.sendMessage(m.chat, {
            text: fmt(`Please provide a group link or JID.\nExample:\n${prefix}gstatus https://chat.whatsapp.com/xxxxx\n${prefix}gstatus 120363427@g.us`),
            quoted: fq
          });
        }

        if (input.includes('chat.whatsapp.com')) {
          const parts = input.split('/');
          const code = parts[parts.length - 1].replace(/[^A-Za-z0-9]/g, '');
          let resolved = null;
          try {
            const info = await client.groupGetInviteInfo(code);
            resolved = info?.id || info?.groupId || info?.gid ||
                       (typeof info === 'string' ? info : null);
          } catch {}
          if (!resolved) {
            try {
              resolved = await client.groupAcceptInvite(code);
            } catch {}
          }
          if (!resolved || typeof resolved !== 'string') {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
            return client.sendMessage(m.chat, { text: fmt(`Invalid or expired group link.`), quoted: fq });
          }
          targetGroupJid = resolved;
        } else if (input.includes('@g.us')) {
          targetGroupJid = input.trim();
        } else {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
          return client.sendMessage(m.chat, { text: fmt(`Invalid group link or JID.`), quoted: fq });
        }
      }

      let sourceMsg = null;
      let mediaType = null;

      if (m.message?.imageMessage) {
        sourceMsg = m.message.imageMessage;
        mediaType = 'image';
      } else if (m.message?.videoMessage) {
        sourceMsg = m.message.videoMessage;
        mediaType = 'video';
      } else if (m.message?.audioMessage) {
        sourceMsg = m.message.audioMessage;
        mediaType = 'audio';
      } else if (m.quoted) {
        if (m.quoted.mtype === 'imageMessage') {
          sourceMsg = m.quoted;
          mediaType = 'image';
        } else if (m.quoted.mtype === 'videoMessage') {
          sourceMsg = m.quoted;
          mediaType = 'video';
        } else if (m.quoted.mtype === 'audioMessage') {
          sourceMsg = m.quoted;
          mediaType = 'audio';
        }
      }

      const caption = m.body
        .replace(new RegExp(`^\\${prefix}(gstatus|groupstatus|gs)\\s*`, 'i'), '')
        .replace(/https?:\/\/chat\.whatsapp\.com\/\S+/gi, '')
        .replace(/\S+@g\.us/gi, '')
        .trim();

      const defaultCaption = `Posted via Toxic-MD\n🪽`;

      const getBuffer = async (msg, type) => {
        const stream = await downloadContentFromMessage(msg, type);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        return buf;
      };

      if (mediaType === 'image') {
        const buf = await getBuffer(sourceMsg, 'image');
        await client.sendMessage(targetGroupJid, { image: buf, caption: caption || defaultCaption });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        return client.sendMessage(m.chat, { text: fmt(`✅ Image posted to group!`), quoted: fq });
      }

      if (mediaType === 'video') {
        const buf = await getBuffer(sourceMsg, 'video');
        await client.sendMessage(targetGroupJid, { video: buf, caption: caption || defaultCaption });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        return client.sendMessage(m.chat, { text: fmt(`✅ Video posted to group!`), quoted: fq });
      }

      if (mediaType === 'audio') {
        const buf = await getBuffer(sourceMsg, 'audio');
        await client.sendMessage(targetGroupJid, { audio: buf, mimetype: 'audio/mp4' });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        return client.sendMessage(m.chat, { text: fmt(`✅ Audio posted to group!`), quoted: fq });
      }

      if (caption) {
        await client.sendMessage(targetGroupJid, { text: caption });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        return client.sendMessage(m.chat, { text: fmt(`✅ Text posted to group!`), quoted: fq });
      }

      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
      return client.sendMessage(m.chat, {
        text: fmt(`Caption an image or reply to media/text with this command.`),
        quoted: fq
      });

    } catch (error) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
      await client.sendMessage(m.chat, { text: fmt(`Error: ${error.message}`), quoted: fq });
    }
  }
};
