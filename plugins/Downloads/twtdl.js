const fetch = require('node-fetch');

  function extractTweetId(url) {
      const m = url.match(/status\/([0-9]+)/);
      return m ? m[1] : null;
  }

  async function vxtwitterFetch(url) {
      const id = extractTweetId(url);
      if (!id) throw new Error('no tweet id');
      const r = await fetch(`https://api.vxtwitter.com/Twitter/status/${id}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!r.ok) throw new Error(`vxtwitter ${r.status}`);
      const d = await r.json();
      const media = d.media_extended || d.mediaURLs || [];
      const video = media.find(m => m.type === 'video' || m.url?.includes('.mp4'));
      if (!video) throw new Error('vxtwitter no video');
      return video.url || video;
  }

  async function twitsaveFetch(url) {
      const r = await fetch(`https://twitsave.com/info?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      const html = await r.text();
      const match = html.match(/https:\/\/[^"'\s]+\.mp4[^"'\s]*/);
      if (!match) throw new Error('twitsave no url');
      return match[0].replace(/&amp;/g, '&');
  }

  async function twittervidFetch(url) {
      const r = await fetch(`https://api.twittervid.xyz/video?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!r.ok) throw new Error(`twittervid ${r.status}`);
      const d = await r.json();
      if (!d.success && !d.video_url && !d.url) throw new Error('twittervid no url');
      return d.video_url || d.url || d.data?.url;
  }

  module.exports = async (context) => {
      const { client, m, text, prefix } = context;
      if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ Give me a Twitter/X link.\n├ Example: ${prefix}twitter https://x.com/user/status/xxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      if (!text.includes('twitter.com') && !text.includes('x.com') && !text.includes('t.co')) return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a Twitter/X link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      let videoUrl = null;
      for (const [name, fn] of [['vxtwitter', vxtwitterFetch], ['twitsave', twitsaveFetch], ['twittervid', twittervidFetch]]) {
          try { videoUrl = await fn(text.trim()); if (videoUrl) break; }
          catch (e) { console.error(`[TWTDL] ${name}:`, e.message); }
      }

      if (!videoUrl) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply('╭───(    TOXIC-MD    )───\n├ Could not download this Twitter/X video.\n├ It might be private or unavailable.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      }

      try {
          const dlRes = await fetch(videoUrl, { timeout: 40000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!dlRes.ok) throw new Error(`fetch ${dlRes.status}`);
          const buf = Buffer.from(await dlRes.arrayBuffer());
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              video: buf, mimetype: 'video/mp4',
              caption: '╭───(    TOXIC-MD    )───\n├───≫ Twitter/X Video ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
          }, { quoted: m });
      } catch (e) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├ ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᷊ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  