import { getFakeQuoted } from '../../lib/fakeQuoted.js';
import { downloadContentFromMessage, getContentType } from '@whiskeysockets/baileys';

export default {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts media or text as a group status (works in groups + remotely from DM).',
  run: async (context) => {
    const { client, m, prefix, IsGroup, botname } = context;
    const fq = getFakeQuoted(m);

    const formatMsg = (text) => `╭───(    TOXIC-MD    )───\n├ \n├ ${text}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    try {
      if (!botname) {
        return client.sendMessage(m.chat, { text: formatMsg(`Bot name is not set.`), quoted: fq });
      }

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

      // ====================== TARGET GROUP ======================
      let targetGroupJid = m.chat;

      if (!IsGroup) {
        const args = m.body.trim().split(/\s+/);
        const input = args[1];

        if (!input) {
          return client.sendMessage(m.chat, { 
            text: formatMsg(`Please reply to media/text and provide group link or JID.\nExample: .gstatus https://chat.whatsapp.com/xxxxx`), 
            quoted: fq 
          });
        }

        if (input.includes('chat.whatsapp.com')) {
          const code = input.split('/').pop();
          try {
            const inviteInfo = await client.groupGetInviteInfo(code);
            targetGroupJid = inviteInfo?.id || inviteInfo?.groupId;
            if (!targetGroupJid) throw new Error();
          } catch {
            return client.sendMessage(m.chat, { text: formatMsg(`Invalid or expired group link.`), quoted: fq });
          }
        } else if (input.endsWith('@g.us')) {
          targetGroupJid = input;
        } else {
          return client.sendMessage(m.chat, { text: formatMsg(`Invalid group link or JID.`), quoted: fq });
        }
      }

      // ====================== MEDIA / TEXT DETECTION ======================
      const quoted = m.quoted || m;
      const messageType = getContentType(quoted.message || quoted);
      const mime = quoted?.mimetype || 
                   quoted?.message?.imageMessage?.mimetype || 
                   quoted?.message?.videoMessage?.mimetype || 
                   quoted?.message?.audioMessage?.mimetype || '';

      const caption = m.body
        .replace(new RegExp(`^${prefix}(gstatus|groupstatus|gs)\\s*`, 'i'), '')
        .replace(/https?:\/\/chat\.whatsapp\.com\/\S+/, '')
        .trim();

      const defaultCaption = `Group status Posted By Toxic-MD\n\nxD\n🪽`;

      const getBuffer = async (msg, type) => {
        try {
          const stream = await downloadContentFromMessage(msg, type);
          let buffer = Buffer.from([]);
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
          return buffer;
        } catch (e) {
          throw new Error('Failed to download media. Reply to a valid image/video/audio.');
        }
      };

      // ====================== POST STATUS ======================
      if (messageType === 'imageMessage' || /image/.test(mime)) {
        const buffer = await getBuffer(quoted, 'image');
        await client.sendMessage(targetGroupJid, {
          image: buffer,
          caption: caption || defaultCaption,
          contextInfo: { isGroupStatus: true }
        }, { quoted: fq });
        await client.sendMessage(m.chat, { text: formatMsg(`✅ Image group status posted!`), quoted: fq });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });

      } else if (messageType === 'videoMessage' || /video/.test(mime)) {
        const buffer = await getBuffer(quoted, 'video');
        await client.sendMessage(targetGroupJid, {
          video: buffer,
          caption: caption || defaultCaption,
          contextInfo: { isGroupStatus: true }
        }, { quoted: fq });
        await client.sendMessage(m.chat, { text: formatMsg(`✅ Video group status posted!`), quoted: fq });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });

      } else if (messageType === 'audioMessage' || /audio/.test(mime)) {
        const buffer = await getBuffer(quoted, 'audio');
        await client.sendMessage(targetGroupJid, {
          audio: buffer,
          mimetype: 'audio/mp4',
          contextInfo: { isGroupStatus: true }
        }, { quoted: fq });
        await client.sendMessage(m.chat, { text: formatMsg(`✅ Audio group status posted!`), quoted: fq });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });

      } else if (caption) {
        await client.sendMessage(targetGroupJid, {
          text: caption,
          contextInfo: { isGroupStatus: true }
        }, { quoted: fq });
        await client.sendMessage(m.chat, { text: formatMsg(`✅ Text group status posted!`), quoted: fq });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });

      } else {
        await client.sendMessage(m.chat, { text: formatMsg(`Please reply to image, video, audio or type text.`), quoted: fq });
      }

    } catch (error) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
      await client.sendMessage(m.chat, { text: formatMsg(`Error: ${error.message}`), quoted: fq });
    }
  }
};