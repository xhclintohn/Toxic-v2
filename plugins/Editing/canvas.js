const { uploadToUrl } = require('../../lib/toUrl');
  const { makeCanvas } = require('../../lib/toxicApi');
  const { getFakeQuoted } = require('../../lib/fakeQuoted');
  const { getSettings } = require('../../database/config');

  module.exports = {
      name: 'canvas',
      aliases: ['canvascard', 'spotifycard'],
      description: 'Generate a Spotify canvas card from an image',
      category: 'Editing',
      run: async (context) => {
          const { client, m } = context;
          const fq = getFakeQuoted(m);
          const settings = await getSettings();
          const prefix = settings.prefix || '.';

          const quoted = m.quoted ? m.quoted : null;
          const mime = quoted?.mimetype || '';
          const args = (m.text || '').replace(/^\S+\s*/, '').trim();

          if (!quoted || !/image/.test(mime)) {
              return client.sendMessage(m.chat, {
                  text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Reply to an image, genius.\n├ Example: ${prefix}canvas Title | Subtitle\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞᠊ʀᴇᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }

          const parts = args.split('|').map(s => s.trim());
          const title = parts[0] || 'Unknown Title';
          const subtitle = parts[1] || '';
          const watermark = parts[2] || 'TOXIC-MD';

          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

          try {
              const media = await quoted.download();
              const imgUrl = await uploadToUrl(media);
              const cardBuf = await makeCanvas(imgUrl, title, 'spotify', subtitle, watermark);

              await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
              await client.sendMessage(m.chat, {
                  image: cardBuf,
                  caption: `╭───(    TOXIC-MD    )───\n├───≫ Cᴀɴᴠᴀs Cᴀʀᴅ ≪───\n├ \n├ ${title}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞᠊ʀᴇᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          } catch {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              await client.sendMessage(m.chat, {
                  text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Canvas generation failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞᠊ʀᴇᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              }, { quoted: fq });
          }
      }
  };
  