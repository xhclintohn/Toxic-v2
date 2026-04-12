const Jimp = require('jimp');

  const EFFECTS_HELP = [
    'blur', 'grayscale/bw/grey', 'invert/negative',
    'sepia/vintage', 'flip', 'mirror', 'rotate',
    'bright/lighten', 'dark/darken', 'contrast',
    'neon/vivid', 'pixelate/pixel', 'sharpen/hd',
    'enhance (default)'
  ];

  module.exports = async (context) => {
      const { client, m, text } = context;

      try {
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

          if (!text && !m.message?.imageMessage && !m.quoted) {
              return m.reply(
                  `╭───(    TOXIC-MD    )───\n` +
                  `├───≫ IMG EDIT ≪───\n` +
                  `├ \n` +
                  `├ Reply to an image with an effect.\n` +
                  `├ \n` +
                  `├ *Available effects:*\n` +
                  ${EFFECTS_HELP.map(e => `├ • ${e}`).join('\n')} +
                  `\n╰──────────────────☉\n` +
                  `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
              );
          }

          const q = m.message?.imageMessage ? m : m.quoted ? m.quoted : null;
          if (!q) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ Reply to an image, dummy.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

          const qmime = q.mimetype || q.msg?.mimetype || '';
          if (!qmime.startsWith('image/')) {
              return m.reply('╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ That is not an image, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
          }

          const prompt = (text || 'enhance').toLowerCase().trim();
          const mediaBuffer = await q.download?.();
          if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) throw new Error('Download failed');

          const img = await Jimp.read(mediaBuffer);

          let appliedEffect = prompt;

          if (prompt.includes('blur')) {
              img.blur(8);
          } else if (prompt.includes('grayscale') || prompt.includes('bw') || prompt.includes('grey') || prompt.includes('gray')) {
              img.grayscale();
              appliedEffect = 'grayscale';
          } else if (prompt.includes('invert') || prompt.includes('negative')) {
              img.invert();
              appliedEffect = 'invert';
          } else if (prompt.includes('sepia') || prompt.includes('vintage') || prompt.includes('old')) {
              img.grayscale().brightness(0.05).contrast(0.1);
              appliedEffect = 'sepia';
          } else if (prompt.includes('mirror')) {
              img.flip(false, true);
              appliedEffect = 'mirror';
          } else if (prompt.includes('flip')) {
              img.flip(true, false);
              appliedEffect = 'flip';
          } else if (prompt.includes('rotate')) {
              img.rotate(90);
              appliedEffect = 'rotate 90°';
          } else if (prompt.includes('bright') || prompt.includes('lighten') || prompt.includes('light')) {
              img.brightness(0.3);
              appliedEffect = 'brighten';
          } else if (prompt.includes('dark') || prompt.includes('darken') || prompt.includes('dim')) {
              img.brightness(-0.3);
              appliedEffect = 'darken';
          } else if (prompt.includes('contrast') || prompt.includes('crisp')) {
              img.contrast(0.4);
              appliedEffect = 'contrast';
          } else if (prompt.includes('pixelate') || prompt.includes('pixel') || prompt.includes('mosaic')) {
              img.pixelate(12);
              appliedEffect = 'pixelate';
          } else if (prompt.includes('neon') || prompt.includes('vivid')) {
              img.contrast(0.3).brightness(0.1);
              appliedEffect = 'vivid';
          } else if (prompt.includes('sharpen') || prompt.includes('hd') || prompt.includes('sharp')) {
              img.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]);
              appliedEffect = 'sharpen';
          } else {
              img.convolute([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]).brightness(0.05).contrast(0.1);
              appliedEffect = 'enhance';
          }

          const resultBuffer = await img.getBufferAsync(Jimp.MIME_JPEG);

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

          await client.sendMessage(m.chat, {
              image: resultBuffer,
              caption: `╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ Effect: ${appliedEffect}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          });

      } catch (err) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  