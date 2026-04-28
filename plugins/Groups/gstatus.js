import { getFakeQuoted } from '../../lib/fakeQuoted.js';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';

export default {
  name: 'gstatus',
  aliases: ['groupstatus', 'gs'],
  description: 'Posts media or text as a group status.',
  run: async (context) => {
    const { client, m, prefix, IsGroup, botname } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    const fmt = (text) => `╭───(    TOXIC-MD    )───\n├ \n├ ${text}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

    try {
      if (!botname) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
        return client.sendMessage(m.chat, { text: fmt(`Bot name is not set.`), quoted: fq });
      }

      let targetGroupJid = null;

      if (IsGroup) {
        targetGroupJid = m.chat;
      } else {
        const rawArgs = m.body.trim().split(/\s+/);
        const input = rawArgs[1];
        if (!input) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
          return client.sendMessage(m.chat, {
            text: fmt(`Reply to media and provide a group link or JID.\nExample:\n${prefix}gstatus https://chat.whatsapp.com/xxxxx\n${prefix}gstatus 120363@g.us`),
            quoted: fq
          });
        }
        if (input.includes('chat.whatsapp.com')) {
          let code;
          try {
            const url = new URL(input);
            code = url.pathname.replace(/^\/+/, '');
          } catch {
            code = input.split('/').pop();
          }
          try {
            const res = await client.groupGetInviteInfo(code);
            targetGroupJid = res?.id || res?.groupId || res?.gid;
            if (!targetGroupJid) throw new Error('no id');
          } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
            return client.sendMessage(m.chat, { text: fmt(`Invalid or expired group link.`), quoted: fq });
          }
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
        if (m.quoted.mtype === 'imageMessage') { sourceMsg = m.quoted; mediaType = 'image'; }
        else if (m.quoted.mtype === 'videoMessage') { sourceMsg = m.quoted; mediaType = 'video'; }
        else if (m.quoted.mtype === 'audioMessage') { sourceMsg = m.quoted; mediaType = 'audio'; }
      }

      const caption = m.body
        .replace(new RegExp(`^\\${prefix}(gstatus|groupstatus|gs)\\s*`, 'i'), '')
        .replace(/https?:\/\/chat\.whatsapp\.com\/\S+/gi, '')
        .replace(/\S+@g\.us/gi, '')
        .trim();

      const defaultCaption = `Group status Posted By Toxic-MD\n\nxD\n🪽`;

      const getBuffer = async (msg, type) => {
        const stream = await downloadContentFromMessage(msg, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
      };

      if (mediaType === 'image') {
        const buffer = await getBuffer(sourceMsg, 'image');
        await client.sendMessage(targetGroupJid, {
          image: buffer,
          caption: caption || defaultCaption,
          contextInfo: { isGroupStatus: true }
        });
      } else if (mediaType === 'video') {
        const buffer = await getBuffer(sourceMsg, 'video');
        await client.sendMessage(targetGroupJid, {
          video: buffer,
          caption: caption || defaultCaption,
          contextInfo: { isGroupStatus: true }
        });
      } else if (mediaType === 'audio') {
        const buffer = await getBuffer(sourceMsg, 'audio');
        await client.sendMessage(targetGroupJid, {
          audio: buffer,
          mimetype: 'audio/mp4',
          contextInfo: { isGroupStatus: true }
        });
      } else if (caption) {
        await client.sendMessage(targetGroupJid, {
          text: caption,
          contextInfo: { isGroupStatus: true }
        });
      } else {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
        return client.sendMessage(m.chat, { text: fmt(`Reply to image, video, audio or include text.`), quoted: fq });
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
      if (!IsGroup) {
        await client.sendMessage(m.chat, { text: fmt(`✅ Status posted to group!`), quoted: fq });
      }

    } catch (error) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
      await client.sendMessage(m.chat, { text: fmt(`Error: ${error.message}`), quoted: fq });
    }
  }
};
