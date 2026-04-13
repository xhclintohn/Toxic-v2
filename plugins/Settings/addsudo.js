const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
  const { getSudoUsers, addSudoUser } = require('../../database/config');
  const { getFakeQuoted } = require('../../lib/fakeQuoted');

  module.exports = async (context) => {
      await ownerMiddleware(context, async () => {
          const { client, m, args, participants } = context;
          const fq = getFakeQuoted(m);

          let numberToAdd;

          if (m.quoted) {
              let targetSender = m.quoted.sender || '';
              if (targetSender.endsWith('@lid')) {
                  const lidKey = targetSender.split('@')[0].split(':')[0];
                  const found = (participants || []).find(p => {
                      const pLid = (p.lid || '').split('@')[0].split(':')[0];
                      return pLid === lidKey;
                  });
                  if (found) targetSender = found.jid || found.id || targetSender;
              }
              numberToAdd = targetSender.split('@')[0].split(':')[0];
          } else if (m.mentionedJid && m.mentionedJid.length > 0) {
              numberToAdd = m.mentionedJid[0].split('@')[0].split(':')[0];
          } else {
              numberToAdd = (args[0] || '').replace(/[^0-9]/g, '');
          }

          if (!numberToAdd || !/^\d+$/.test(numberToAdd)) {
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ ADD SUDO ≪───\n` +
                      `├ \n` +
                      `├ Pathetic attempt, moron!\n` +
                      `├ Give me a valid number or quote a user, fool!\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }

          const sudoUsers = await getSudoUsers();
          if (sudoUsers.includes(numberToAdd)) {
              return client.sendMessage(m.chat, {
                  text:
                      `╭───(    TOXIC-MD    )───\n` +
                      `├───≫ ADD SUDO ≪───\n` +
                      `├ \n` +
                      `├ Already a sudo user, you clueless twit!\n` +
                      `├ ${numberToAdd} is already in the elite ranks.\n` +
                      `╰──────────────────☉\n` +
                      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }

          await addSudoUser(numberToAdd);
          await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
          return client.sendMessage(m.chat, {
              text:
                  `╭───(    TOXIC-MD    )───\n` +
                  `├───≫ ADD SUDO ≪───\n` +
                  `├ \n` +
                  `├ Bow down!\n` +
                  `├ ${numberToAdd} is now a Sudo King!\n` +
                  `╰──────────────────☉\n` +
                  `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          }, { quoted: fq });
      });
  };
  