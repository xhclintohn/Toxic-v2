const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
  const linkMiddleware = require('../../utils/botUtil/linkMiddleware');
  const { getFakeQuoted } = require('../../lib/fakeQuoted');

  module.exports = async (context) => {
      await linkMiddleware(context, async () => {
          const { client, m } = context;
          const fq = getFakeQuoted(m);

          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
          try {
              const code = await client.groupInviteCode(m.chat);
              const link = `https://chat.whatsapp.com/${code}`;

              const bodyText =
                  `╭───(    TOXIC-MD    )───\n` +
                  `├───≫ Gʀᴏᴜᴘ Lɪɴᴋ ≪───\n` +
                  `├ \n` +
                  `├ ${link}\n` +
                  `├ \n` +
                  `├ Here's your precious link.\n` +
                  `├ Copy it and stop bugging me.\n` +
                  `╰──────────────────☉\n` +
                  `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

              try {
                  const msg = await generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                      interactiveMessage: {
                          body: { text: bodyText },
                          footer: { text: '' },
                          nativeFlowMessage: {
                              buttons: [{
                                  name: 'cta_copy',
                                  buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Link', copy_code: link })
                              }],
                              messageParamsJson: ''
                          }
                      }
                  }), { quoted: fq, userJid: client.user.id });
                  await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
              } catch {
                  await m.reply(bodyText);
              }

              await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          } catch {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Couldn't fetch the link.\n├ Either make me admin or quit.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
          }
      });
  };
  