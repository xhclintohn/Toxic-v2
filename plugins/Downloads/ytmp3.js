const fetch = require('node-fetch');
  const ytdl = require('ytdl-core');

  function streamToBuffer(stream) {
      return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', c => chunks.push(c));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
      });
  }

  function extractYtUrl(text) {
      const m = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/)?)([\/a-zA-Z0-9_-]{11})/i);
      if (!m) return null;
      return `https://www.youtube.com/watch?v=${m[1]}`;
  }

  module.exports = async (context) => {
      const { client, m, text, botname } = context;

      if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ You forgot the YouTube link, ${m.pushName}.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      const ytUrl = extractYtUrl(text);
      if (!ytUrl) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ Paste a valid YouTube link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      try {
          const info = await ytdl.getInfo(ytUrl);
          const title = info.videoDetails.title;
          const duration = info.videoDetails.lengthSeconds;
          const mins = Math.floor(duration / 60);
          const secs = String(duration % 60).padStart(2, '0');

          const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
          if (!format) throw new Error('No audio format found');

          const audioStream = ytdl(ytUrl, { format });
          const audioBuf = await streamToBuffer(audioStream);
          const mimeType = format.container === 'mp4' ? 'audio/mp4' : 'audio/ogg; codecs=opus';

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              audio: audioBuf,
              mimetype: mimeType,
              ptt: false,
              fileName: `${title}.mp3`
          }, { quoted: m });

          await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Yᴛ Mᴘ3 ≪───\n├ ${title}\n├ Duration: ${mins}:${secs}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

      } catch (err) {
          console.error('[YTMP3] error:', err);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  