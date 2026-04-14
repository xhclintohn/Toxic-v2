const { getSettings } = require('../../database/config');
  const { uploadToUrl } = require('../../lib/uploader');
  const { makePhotoEdit } = require('../../lib/toxicApi');
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');

  module.exports = {
      name: 'imgedit',
      aliases: ['photoedit', 'aiedit'],
      description: 'AI photo editor',
      category: 'Editing',
      async execute(client, m, args) {
          const fq = m.messages ? m.messages[0] : m;
          const settings = await getSettings();
          const prefix = settings.prefix || '.';

          const quoted = fq.message?.extendedTextMessage?.contextInfo?.quotedMessage;
          const hasImg = fq.message?.imageMessage || quoted?.imageMessage;
          const prompt = args.join(' ').trim();

          if (!hasImg || !prompt) {
              return client.sendMessage(m.chat, {
                  text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Reply to an image with a prompt.\n├ Example: ${prefix}imgedit make it look like night\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }

          await client.sendMessage(m.chat, {
              text: `╭───(    TOXIC-MD    )───\n├───≫ Pʀᴏᴄᴇssɪɴɢ ≪───\n├ \n├ Editing your trash photo...\n├ Prompt: ${prompt}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          }, { quoted: fq });

          try {
              const imgBuf = await downloadMediaMessage(fq, 'buffer', {});
              const imgLink = await uploadToUrl(imgBuf);
              const resultUrl = await makePhotoEdit(imgLink, prompt);

              await client.sendMessage(m.chat, {
                  image: { url: resultUrl },
                  caption: `╭───(    TOXIC-MD    )───\n├───≫ Dᴏɴᴇ ≪───\n├ \n├ Here's your edited image.\n├ Prompt: ${prompt}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          } catch {
              await client.sendMessage(m.chat, {
                  text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ AI edit failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᠊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }
      }
  };
  