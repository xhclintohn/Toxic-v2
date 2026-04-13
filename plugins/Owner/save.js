const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
  const { getFakeQuoted } = require('../../lib/fakeQuoted');

  async function _dlMedia(client, m) {
      const mtype = m.quoted.mtype || '';
      const typeMap = {
          imageMessage: 'image',
          videoMessage: 'video',
          stickerMessage: 'sticker',
          audioMessage: 'audio',
          pttMessage: 'audio',
          documentMessage: 'document',
      };
      const mediaType = typeMap[mtype];
      if (!mediaType) return null;
      try {
          const stream = await downloadContentFromMessage(m.quoted, mediaType);
          const chunks = [];
          for await (const chunk of stream) chunks.push(chunk);
          const buf = Buffer.concat(chunks);
          return buf.length > 0 ? buf : null;
      } catch {
          try { return await client.downloadMediaMessage(m.quoted); } catch { return null; }
      }
  }

  module.exports = {
      name: 'save',
      aliases: ['sv'],
      run: async (context) => {
          const { client, m, participants } = context;
          const fq = getFakeQuoted(m);

          if (!m.quoted) {
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ SAVE ≪───\n` +
                      `├ \n` +
                      `├ Reply to something first, genius.\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }

          const mtype = m.quoted.mtype || '';
          const isStatus = (m.quoted.chat || '').includes('status@broadcast');

          let targetJid;
          if (isStatus) {
              targetJid = m.chat;
          } else {
              targetJid = m.isGroup ? (m.sender || m.key?.participant || m.chat) : m.chat;
              if (targetJid?.endsWith('@lid')) {
                  const lidKey = targetJid.split('@')[0].split(':')[0];
                  const found = (participants || []).find(p =>
                      (p.lid || '').split('@')[0].split(':')[0] === lidKey
                  );
                  if (found) targetJid = found.jid || found.id || targetJid;
              }
              if (targetJid && !targetJid.includes('@')) targetJid += '@s.whatsapp.net';
          }

          try {
              await client.sendMessage(m.chat, { react: { text: '💾', key: m.key } });
              const caption = m.quoted.text || m.quoted.caption || '';
              const mime = m.quoted.mimetype || '';
              const mediaTypes = ['imageMessage', 'videoMessage', 'stickerMessage', 'audioMessage', 'pttMessage', 'documentMessage'];

              if (mediaTypes.includes(mtype)) {
                  const buf = await _dlMedia(client, m);
                  if (!buf) throw new Error('download failed');
                  if (mtype === 'imageMessage') {
                      await client.sendMessage(targetJid, { image: buf, caption });
                  } else if (mtype === 'videoMessage') {
                      await client.sendMessage(targetJid, { video: buf, caption });
                  } else if (mtype === 'stickerMessage') {
                      await client.sendMessage(targetJid, { sticker: buf });
                  } else if (mtype === 'audioMessage' || mtype === 'pttMessage') {
                      await client.sendMessage(targetJid, { audio: buf, mimetype: mime || 'audio/ogg; codecs=opus', ptt: mtype === 'pttMessage' });
                  } else if (mtype === 'documentMessage') {
                      await client.sendMessage(targetJid, { document: buf, mimetype: mime || 'application/octet-stream', fileName: m.quoted.fileName || 'file' });
                  }
              } else {
                  const txt = m.quoted.text || m.quoted.caption || '';
                  if (txt) {
                      await client.sendMessage(targetJid, { text: txt });
                  } else {
                      await m.quoted.copyNForward(targetJid, true);
                  }
              }

              const msg = isStatus ? 'Status saved.' : 'Saved. Check your DM.';
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ SAVE ≪───\n` +
                      `├ \n` +
                      `├ ${msg}\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });

          } catch (err) {
              console.log('❌ [SAVE]:', err?.message || err);
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ SAVE ≪───\n` +
                      `├ \n` +
                      `├ Couldn't save that. Try again.\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }
      }
  };
  