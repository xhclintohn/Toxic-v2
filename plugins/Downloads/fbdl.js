const fetch = require('node-fetch');

  async function agatzFetch(url) {
      const r = await fetch(`https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      if (!r.ok) throw new Error(`agatz ${r.status}`);
      const d = await r.json();
      const items = d?.data || d?.result || [];
      if (!items.length) throw new Error('agatz no media');
      const hd = items.find(i => (i.quality || i.type || '').toLowerCase().includes('hd')) || items[0];
      const videoUrl = hd?.url || (typeof hd === 'string' ? hd : null);
      if (!videoUrl) throw new Error('agatz no url');
      return videoUrl;
  }

  async function snapsaveFetch(url) {
      const params = new URLSearchParams({ url, lang: 'en' });
      const r = await fetch('https://snapsave.app/action.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://snapsave.app', 'Referer': 'https://snapsave.app/' },
          body: params.toString(),
          timeout: 15000
      });
      const html = await r.text();
      const re = new RegExp('href="(https?:\\/\\/[^"]+\\.mp4[^"]*)"', 'i');
      const match = html.match(re);
      if (!match) throw new Error('snapsave no url');
      return match[1].replace(/&amp;/g, '&');
  }

  async function getfvidFetch(url) {
      const r = await fetch(`https://getfvid.com/downloader?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      const html = await r.text();
      const re = new RegExp('href="(https?:\\/\\/[^"]+\\.mp4[^"]*)"', 'i');
      const match = html.match(re);
      if (!match) throw new Error('getfvid no url');
      return match[1].replace(/&amp;/g, '&');
  }

  module.exports = async (context) => {
      const { client, m, text, prefix } = context;
      if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ Where's the Facebook link?\n├ Example: ${prefix}facebook https://www.facebook.com/reel/xxxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      if (!text.includes('facebook.com') && !text.includes('fb.watch')) return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a Facebook link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      let videoUrl = null;
      for (const [name, fn] of [['agatz', agatzFetch], ['snapsave', snapsaveFetch], ['getfvid', getfvidFetch]]) {
          try { videoUrl = await fn(text.trim()); if (videoUrl) break; }
          catch (e) { console.error(`[FBDL] ${name}:`, e.message); }
      }

      if (!videoUrl) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply('╭───(    TOXIC-MD    )───\n├ Could not download this Facebook video.\n├ It might be private or unavailable.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      }

      try {
          const dlRes = await fetch(videoUrl, { timeout: 40000, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!dlRes.ok) throw new Error(`fetch ${dlRes.status}`);
          const buf = Buffer.from(await dlRes.arrayBuffer());
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              video: buf, mimetype: 'video/mp4',
              caption: '╭───(    TOXIC-MD    )───\n├───≫ Facebook DL ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
          }, { quoted: m });
      } catch (e) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├ ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  