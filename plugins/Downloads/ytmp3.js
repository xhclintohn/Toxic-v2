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
          const dur = parseInt(info.videoDetails.lengthSeconds);
          const mins = Math.floor(dur / 60), secs = String(dur % 60).padStart(2, '0');

          const fmt = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
          if (!fmt) throw new Error('No audio format available');

          const buf = await streamToBuffer(ytdl(url, { format: fmt }));

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              audio: buf,
              mimetype: fmt.container === 'mp4' ? 'audio/mp4' : 'audio/mpeg',
              ptt: false,
              fileName: `${title}.mp3`
          }, { quoted: m });
          await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Yᴛ Mᴘ3 ≪───\n├ ${title}\n├ Duration: ${mins}:${secs}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      } catch (e) {
          console.error('[YTMP3]', e.message);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  