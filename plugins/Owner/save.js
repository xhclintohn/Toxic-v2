const { getFakeQuoted } = require('../../lib/fakeQuoted');

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
                      `├ Reply to a message first, genius.\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }

          let senderJid = m.isGroup ? (m.sender || m.key?.participant || '') : m.chat;
          if (senderJid.endsWith('@lid')) {
              const lidKey = senderJid.split('@')[0].split(':')[0];
              const found = (participants || []).find(p => {
                  const pLid = (p.lid || '').split('@')[0].split(':')[0];
                  return pLid === lidKey;
              });
              if (found) senderJid = found.jid || found.id || senderJid;
          }
          if (!senderJid.includes('@')) senderJid = senderJid + '@s.whatsapp.net';

          try {
              await m.quoted.copyNForward(senderJid, true);
              await client.sendMessage(m.chat, { react: { text: '💾', key: m.key } });
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ SAVE ≪───\n` +
                      `├ \n` +
                      `├ Saved. Check your DM.\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          } catch {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ SAVE ≪───\n` +
                      `├ \n` +
                      `├ Couldn't forward that. Try again.\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }
      }
  };
  