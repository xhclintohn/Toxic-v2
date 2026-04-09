const fetch = require('node-fetch');
  const ytdl = require('ytdl-core');

  async function cobaltFetch(url) {
      const res = await fetch('https://api.cobalt.tools/', {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, downloadMode: 'auto' }),
          timeout: 15000
      });
      if (!res.ok) throw new Error(`cobalt ${res.status}`);
      const d = await res.json();
      if (d.status === 'redirect' || d.status === 'tunnel' || d.status === 'stream') return { url: d.url, isVideo: true };
      if (d.status === 'picker' && d.picker?.length) return { url: d.picker[0].url, isVideo: d.picker[0].type !== 'photo' };
      throw new Error(d.error?.code || 'cobalt returned no URL');
  }

  async function tikwmFetch(url) {
      const params = new URLSearchParams({ url, count: '12', cursor: '0', web: '1', hd: '1' });
      const res = await fetch('https://www.tikwm.com/api/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
          body: params.toString(), timeout: 15000
      });
      if (!res.ok) throw new Error(`tikwm ${res.status}`);
      const d = await res.json();
      if (d.code !== 0) throw new Error(d.msg || 'tikwm failed');
      return { url: d.data.play, isVideo: true };
  }

  async function igFetch(url) {
      const encoded = encodeURIComponent(url);
      for (const api of [
          async () => {
              const r = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encoded}`, { timeout: 12000 });
              const d = await r.json();
              if (!d.data?.[0]?.url) throw new Error('no media');
              return { url: d.data[0].url, isVideo: d.data[0].type === 'video' };
          },
          async () => {
              const r = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encoded}`, { timeout: 12000 });
              const d = await r.json();
              if (!d.data?.[0]?.url) throw new Error('no media');
              return { url: d.data[0].url, isVideo: true };
          }
      ]) {
          try { return await api(); } catch {}
      }
      throw new Error('all IG sources failed');
  }

  function streamToBuffer(stream) {
      return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', c => chunks.push(c));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
      });
  }

  module.exports = async (context) => {
      const { client, m, text, botname } = context;

      if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├ Please provide a link to download\n├ Supports: YouTube, TikTok, Instagram, Twitter, Facebook, Reddit\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      try {
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

          const url = text.trim();
          let mediaUrl = null;
          let isVideo = true;
          let isBuffer = false;
          let audioBuf = null;

          const isTiktok = /tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url);
          const isIG = /instagram\.com/i.test(url);
          const isYT = /youtube\.com|youtu\.be/i.test(url);

          if (isYT) {
              const info = await ytdl.getInfo(url);
              const format = ytdl.chooseFormat(info.formats, { filter: f => f.hasVideo && f.hasAudio, quality: 'highest' });
              if (!format) throw new Error('No YT format found');
              audioBuf = await streamToBuffer(ytdl(url, { format }));
              isBuffer = true;
              isVideo = true;
          } else if (isTiktok) {
              const r = await tikwmFetch(url);
              mediaUrl = r.url;
              isVideo = r.isVideo;
          } else if (isIG) {
              const r = await igFetch(url);
              mediaUrl = r.url;
              isVideo = r.isVideo;
          } else {
              const r = await cobaltFetch(url);
              mediaUrl = r.url;
              isVideo = r.isVideo;
          }

          if (!mediaUrl && !isBuffer) {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              return m.reply('╭───(    TOXIC-MD    )───\n├ Failed to download media\n├ Link might be invalid, private, or unsupported\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
          }

          let buf = audioBuf;
          if (!isBuffer && mediaUrl) {
              const dlRes = await fetch(mediaUrl, { timeout: 40000, headers: { 'User-Agent': 'Mozilla/5.0' } });
              if (!dlRes.ok) throw new Error(`download ${dlRes.status}`);
              buf = Buffer.from(await dlRes.arrayBuffer());
          }

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

          const caption = `╭───(    TOXIC-MD    )───\n├───≫ Media Downloader ≪───\n├ Downloaded By : ${botname || 'Toxic-MD'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

          if (isVideo) {
              await client.sendMessage(m.chat, { video: buf, caption, mimetype: 'video/mp4', gifPlayback: false }, { quoted: m });
          } else {
              await client.sendMessage(m.chat, { image: buf, caption }, { quoted: m });
          }
      } catch (error) {
          console.error('AllDL Error:', error);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├ Download failed\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  