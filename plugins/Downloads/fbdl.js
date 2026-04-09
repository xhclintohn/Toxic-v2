const fetch = require('node-fetch');

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

  async function fdownloaderFetch(url) {
      const res = await fetch(`https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!res.ok) throw new Error(`fdownloader ${res.status}`);
      const d = await res.json();
      const items = d?.data || d?.result || [];
      if (!Array.isArray(items) || !items.length) throw new Error('no media');
      const hd = items.find(i => i.quality === 'HD') || items[0];
      return hd.url || hd;
  }

  module.exports = async (context) => {
      const { client, m, text, prefix } = context;

      if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ Where's the Facebook link?\n├ Example: ${prefix}facebook https://www.facebook.com/reel/xxxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      if (!text.includes('facebook.com') && !text.includes('fb.watch')) return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a Facebook link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      let videoUrl = null;

      try { const r = await cobaltFetch(text.trim()); videoUrl = r.url; } catch {}
      if (!videoUrl) {
          try { videoUrl = await fdownloaderFetch(text.trim()); } catch {}
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
              video: buf, mimetype: 'video/mp4', gifPlayback: false,
              caption: '╭───(    TOXIC-MD    )───\n├───≫ Facebook DL ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
          }, { quoted: m });
      } catch (err) {
          console.error('[FBDL] send error:', err);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  