const fetch = require('node-fetch');
  const ytdl = require('@distube/ytdl-core');

  function streamToBuffer(stream) {
      return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', c => chunks.push(c));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
      });
  }

  function extractYtId(url) {
      const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|v\/))([A-Za-z0-9_-]{11})/);
      return m ? m[1] : null;
  }

  async function tikwmFetch(url) {
      const params = new URLSearchParams({ url, count: '1', cursor: '0', web: '1', hd: '1' });
      const r = await fetch('https://www.tikwm.com/api/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
          body: params.toString(), timeout: 15000
      });
      const d = await r.json();
      if (d.code !== 0) throw new Error(d.msg || 'tikwm failed');
      return { url: d.data.play, isVideo: true };
  }

  async function igFetch(url) {
      const enc = encodeURIComponent(url.split('?')[0]);
      for (const [label, apiUrl, parse] of [
          ['saveig', `https://api.saveig.app/api?url=${enc}`, d => d.data?.[0]?.url],
          ['nyxs', `https://api.nyxs.pw/dl/ig?url=${enc}`, d => d.result?.media?.[0]?.url],
          ['ryzendesu', `https://api.ryzendesu.vip/api/downloader/igdl?url=${enc}`, d => d.data?.[0]?.url]
      ]) {
          try {
              const r = await fetch(apiUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
              const d = await r.json();
              const mediaUrl = parse(d);
              const type = d.data?.[0]?.type || 'video';
              if (mediaUrl) return { url: mediaUrl, isVideo: type.includes('video') };
          } catch {}
      }
      throw new Error('all IG sources failed');
  }

  async function twitterFetch(url) {
      const idMatch = url.match(/status\/([0-9]+)/);
      if (!idMatch) throw new Error('no tweet id');
      const r = await fetch(`https://api.vxtwitter.com/Twitter/status/${idMatch[1]}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      const video = (d.media_extended || []).find(m => m.type === 'video' || m.url?.includes('.mp4'));
      if (!video) throw new Error('no video in tweet');
      return { url: video.url, isVideo: true };
  }

  async function fbFetch(url) {
      const r = await fetch(`https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      const items = d?.data || d?.result || [];
      if (!items.length) throw new Error('fb no media');
      const hd = items.find(i => (i.quality || '').toLowerCase().includes('hd')) || items[0];
      return { url: hd?.url || hd, isVideo: true };
  }

  module.exports = async (context) => {
      const { client, m, text, botname } = context;
      if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├ Provide a link to download.\n├ Supports: YouTube, TikTok, Instagram, Twitter, Facebook\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      try {
          const url = text.trim();
          let buf = null;
          let isVideo = true;
          const isYT = /youtube\.com|youtu\.be/i.test(url);
          const isTT = /tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(url);
          const isIG = /instagram\.com/i.test(url);
          const isTW = /twitter\.com|x\.com|t\.co/i.test(url);
          const isFB = /facebook\.com|fb\.watch/i.test(url);

          if (isYT) {
              const id = extractYtId(url);
              if (!id) throw new Error('Invalid YouTube URL');
              const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`);
              const fmt = ytdl.chooseFormat(info.formats, { filter: f => f.hasVideo && f.hasAudio, quality: 'highest' });
              if (!fmt) throw new Error('No video format available');
              buf = await streamToBuffer(ytdl(`https://www.youtube.com/watch?v=${id}`, { format: fmt }));
              isVideo = true;
          } else if (isTT) {
              const { url: mediaUrl } = await tikwmFetch(url);
              const r = await fetch(mediaUrl, { timeout: 35000, headers: { 'User-Agent': 'Mozilla/5.0' } });
              buf = Buffer.from(await r.arrayBuffer());
              isVideo = true;
          } else if (isIG) {
              const { url: mediaUrl, isVideo: vid } = await igFetch(url);
              const r = await fetch(mediaUrl, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.instagram.com/' } });
              buf = Buffer.from(await r.arrayBuffer());
              isVideo = vid;
          } else if (isTW) {
              const { url: mediaUrl } = await twitterFetch(url);
              const r = await fetch(mediaUrl, { timeout: 35000, headers: { 'User-Agent': 'Mozilla/5.0' } });
              buf = Buffer.from(await r.arrayBuffer());
              isVideo = true;
          } else if (isFB) {
              const { url: mediaUrl } = await fbFetch(url);
              const r = await fetch(mediaUrl, { timeout: 35000, headers: { 'User-Agent': 'Mozilla/5.0' } });
              buf = Buffer.from(await r.arrayBuffer());
              isVideo = true;
          } else {
              throw new Error('Unsupported link. Try YouTube, TikTok, Instagram, Twitter, or Facebook.');
          }

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          const cap = `╭───(    TOXIC-MD    )───\n├───≫ Media Downloader ≪───\n├ Downloaded By: ${botname || 'Toxic-MD'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
          if (isVideo) {
              await client.sendMessage(m.chat, { video: buf, caption: cap, mimetype: 'video/mp4', gifPlayback: false }, { quoted: m });
          } else {
              await client.sendMessage(m.chat, { image: buf, caption: cap }, { quoted: m });
          }
      } catch (e) {
          console.error('[ALLDL]', e.message);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├ Download failed: ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  