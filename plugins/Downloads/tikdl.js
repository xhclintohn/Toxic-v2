const fetch = require('node-fetch');
  const { tiktok: mintakeTiktok } = require('mintake');

  async function tikwmFetch(url) {
      const params = new URLSearchParams({ url, count: '12', cursor: '0', web: '1', hd: '1' });
      const res = await fetch('https://www.tikwm.com/api/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
          body: params.toString(),
          timeout: 15000
      });
      if (!res.ok) throw new Error(`tikwm ${res.status}`);
      const d = await res.json();
      if (d.code !== 0) throw new Error(d.msg || 'tikwm failed');
      return d.data;
  }

  module.exports = async (context) => {
      const { client, m, text } = context;

      if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Mɪssɪɴɢ Uʀʟ ≪───\n├ Send a TikTok link you clown.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      if (!text.includes('tiktok.com') && !text.includes('vm.tiktok') && !text.includes('vt.tiktok')) {
          return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ That\'s not a TikTok link. Are you blind?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      }

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      let videoUrl = null, musicUrl = null, username = 'unknown', stats = {};

      try {
          const data = await tikwmFetch(text);
          videoUrl = data.play;
          musicUrl = data.music;
          username = data.author?.nickname || 'unknown';
          stats = { views: data.play_count || 0, likes: data.digg_count || 0, comments: data.comment_count || 0 };
      } catch (e1) {
          console.error('[TIKDL] tikwm failed:', e1.message, '— trying mintake...');
          try {
              const result = await mintakeTiktok(text);
              videoUrl = result?.video?.noWatermark || result?.video?.watermark;
              musicUrl = result?.music?.url;
              username = result?.author?.nickname || 'unknown';
          } catch (e2) {
              console.error('[TIKDL] mintake failed:', e2.message);
          }
      }

      if (!videoUrl) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Could not download this TikTok.\n├ Make sure the link is valid.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      }

      try {
          const vidRes = await fetch(videoUrl, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!vidRes.ok) throw new Error(`video fetch ${vidRes.status}`);
          const vidBuf = Buffer.from(await vidRes.arrayBuffer());

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

          const caption = `╭───(    TOXIC-MD    )───\n├───≫ Tɪᴋᴛᴏᴋ Dʟ ≪───\n├ User: @${username}\n├ Views: ${stats.views?.toLocaleString() || '?'} | Likes: ${stats.likes?.toLocaleString() || '?'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
          await client.sendMessage(m.chat, { video: vidBuf, caption }, { quoted: m });

          if (musicUrl) {
              try {
                  const musRes = await fetch(musicUrl, { timeout: 20000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                  if (musRes.ok) {
                      const musBuf = Buffer.from(await musRes.arrayBuffer());
                      await client.sendMessage(m.chat, { audio: musBuf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m });
                  }
              } catch {}
          }
      } catch (err) {
          console.error('[TIKDL] send error:', err);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  