const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
  const { getFakeQuoted } = require('../../lib/fakeQuoted');

  module.exports = {
      name: 'jid',
      alias: ['getjid', 'id', 'getid'],
      description: 'Get group JID or extract JID from invite link',
      run: async (context) => {
          const { client, m } = context;
          const fq = getFakeQuoted(m);
          const args = m.text?.trim().split(/\s+/).slice(1) || [];
          const input = args[0] || '';

          let targetJid = '';
          let displayLabel = '';

          if (m.isGroup && !input) {
              targetJid = m.chat;
              displayLabel = 'Group JID';
          } else if (input && input.includes('chat.whatsapp.com/')) {
              const code = input.split('chat.whatsapp.com/')[1]?.split(/[\s?]/)[0];
              if (!code) {
                  return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ That's not a valid invite link, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
              }
              try {
                  const info = await client.groupGetInviteInfo(code);
                  targetJid = info.id;
                  displayLabel = info.subject || 'Group JID';
              } catch {
                  return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Couldn't fetch that group info.\n├ Invalid link or I'm not in that group.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
              }
          } else {
              return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Use this in a group, or provide a\n├ WhatsApp group link in DM.\n├ Example: !jid https://chat.whatsapp.com/xxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
          }

          const bodyText =
              `╭───(    TOXIC-MD    )───\n` +
              `├───≫ Gʀᴏᴜᴘ JID ≪───\n` +
              `├ \n` +
              `├ 📛 ${displayLabel}\n` +
              `├ 🆔 ${targetJid}\n` +
              `├ \n` +
              `├ There's your ID. Now leave me alone.\n` +
              `╰──────────────────☉\n` +
              `> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

          try {
              const msg = await generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                  interactiveMessage: {
                      body: { text: bodyText },
                      footer: { text: '' },
                      nativeFlowMessage: {
                          buttons: [{
                              name: 'cta_copy',
                              buttonParamsJson: JSON.stringify({ display_text: '📋 Copy JID', copy_code: targetJid })
                          }],
                          messageParamsJson: ''
                      }
                  }
              }), { quoted: fq, userJid: client.user.id });
              await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
          } catch {
              await m.reply(bodyText);
          }
      }
  };
  