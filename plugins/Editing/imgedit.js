const { makePhotoEdit } = require('../../lib/toxicApi');
  const { uploadToUrl } = require('../../lib/toUrl');
  const { getFakeQuoted } = require('../../lib/fakeQuoted');

  module.exports = async (context) => {
      const { client, m, text } = context;
      const fq = getFakeQuoted(m);

      try {
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

          if (!text) {
              return m.reply(
                  `╭───(    TOXIC-MD    )───\n` +
                  `├───≫ IMG EDIT ≪───\n` +
                  `├ \n` +
                  `├ Reply to an image with a prompt.\n` +
                  `├ \n` +
                  `├ *Examples:*\n` +
                  `├ • .imgedit remove the person\n` +
                  `├ • .imgedit make it anime\n` +
                  `├ • .imgedit add sunglasses\n` +
                  `├ • .imgedit make background blue\n` +
                  `╰──────────────────☉\n` +
                  `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              );
          }

          const q = m.message?.imageMessage ? m : m.quoted ? m.quoted : null;
          if (!q) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ Reply to an image first, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

          const qmime = q.mimetype || q.msg?.mimetype || '';
          if (!qmime.startsWith('image/')) {
              return m.reply('╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ That is not an image.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
          }

          const mediaBuffer = await q.download?.();
          if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) throw new Error('Download failed');

          const imgLink = await uploadToUrl(mediaBuffer, 'jpg');
          const resultBuffer = await makePhotoEdit(imgLink, text.trim());

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              image: resultBuffer,
              caption: `╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ 🪄 Prompt: ${text.slice(0,80)}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          }, { quoted: fq });

      } catch (err) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ Edit failed, try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };