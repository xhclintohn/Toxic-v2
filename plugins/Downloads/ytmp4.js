const ytdl = require('@distube/ytdl-core');

  function streamToBuffer(stream) {
      return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', c => chunks.push(c));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
      });
  }

  function extractYtId(text) {
      const m = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
  }

  module.exports = async (context) => {
      const { client, m, text } = context;
      if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├ Provide a YouTube link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      const id = extractYtId(text.trim());
      if (!id) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ Paste a valid YouTube link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      try {
          const url = `https://www.youtube.com/watch?v=${id}`;
          const info = await ytdl.getInfo(url);
          const title = info.videoDetails.title;
          const thumb = info.videoDetails.thumbnails.slice(-1)[0]?.url || '';

          const fmt = ytdl.chooseFormat(info.formats, { filter: f => f.hasVideo && f.hasAudio, quality: 'highest' })
              || ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
          if (!fmt) throw new Error('No video format available');

          const buf = await streamToBuffer(ytdl(url, { format: fmt }));

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              video: buf,
              mimetype: 'video/mp4',
              fileName: `${title}.mp4`,
              contextInfo: {
                  externalAdReply: {
                      title,
                      body: 'Toxic-MD YouTube DL',
                      thumbnailUrl: thumb,
                      sourceUrl: url,
                      mediaType: 2,
                      renderLargerThumbnail: true
                  }
              }
          }, { quoted: m });
      } catch (e) {
          console.error('[YTMP4]', e.message);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  