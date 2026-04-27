import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
  import { uploadToUrl } from '../../lib/toUrl.js';
  import { getFakeQuoted } from '../../lib/fakeQuoted.js';

  export default async (context) => {
      const { client, m } = context;
      const fq = getFakeQuoted(m);

      try {
          const q = m.quoted ? m.quoted : m;
          const mime = (q.msg || q).mimetype || '';

          if (!mime) return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Quote or send a media file to upload.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

          const mediaBuffer = await q.download();

          if (mediaBuffer.length > 256 * 1024 * 1024) {
              return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ File too large! Max 256MB.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
          }

          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

          const ext = mime.split('/')[1] || 'bin';
          const link = await uploadToUrl(mediaBuffer, ext);
          const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });

          const resultText =
              `╭───(    TOXIC-MD    )───\n` +
              `├───≫ Uᴘʟᴏᴀᴅ Dᴏɴᴇ ≪───\n` +
              `├ \n` +
              `├ 🔗 *Link:* ${link}\n` +
              `├ 📁 *Size:* ${fileSizeMB} MB\n` +
              `╰──────────────────☉\n` +
              `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

          try {
              const msg = await generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                  interactiveMessage: {
                      body: { text: resultText },
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
              await m.reply(resultText);
          }

      } catch (err) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Uᴘʟᴏᴀᴅ Eʀʀᴏʀ ≪───\n├ \n├ Upload failed, try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };