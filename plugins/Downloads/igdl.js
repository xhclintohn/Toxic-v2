const fetch = require('node-fetch');

  async function tryFetch(label, fn) {
      try { return await fn(); } catch (e) { console.error(`[IGDL] ${label}:`, e.message); return null; }
  }

  async function fetchSaveig(url) {
      const r = await fetch(`https://api.saveig.app/api?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      if (!d.success || !d.data?.length) throw new Error('saveig no data');
      return d.data.map(i => ({ url: i.url, type: i.type?.includes('video') ? 'video' : 'image' }));
  }

  async function fetchInstasave(url) {
      const r = await fetch(`https://api.instasave.xyz/instagram?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      const items = d.result || d.data || d.medias || [];
      if (!items.length) throw new Error('instasave no data');
      return items.map(i => ({ url: i.url || i, type: (i.type || 'video').includes('video') ? 'video' : 'image' }));
  }

  async function fetchNyxs(url) {
      const r = await fetch(`https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      const media = d.result?.media || d.data || [];
      if (!media.length) throw new Error('nyxs no data');
      return media.map(i => ({ url: i.url || i, type: 'video' }));
  }

  async function fetchRyzendesu(url) {
      const r = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      const items = d.data || d.result || [];
      if (!items.length) throw new Error('ryzendesu no data');
      return items.map(i => ({ url: i.url, type: i.type?.includes('video') ? 'video' : 'image' }));
  }

  async function fetchSiputzx(url) {
      const r = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000 });
      const d = await r.json();
      const items = d.data || [];
      if (!items.length) throw new Error('siputzx no data');
      return items.map(i => ({ url: i.url, type: i.type?.includes('video') ? 'video' : 'image' }));
  }

  module.exports = async (context) => {
      const { client, m, text } = context;
      if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Mɪssɪɴɢ Uʀʟ ≪───\n├ Give me an Instagram link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      if (!text.includes('instagram.com')) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ That\'s not an Instagram link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      const cleanUrl = text.split('?')[0].trim();
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      let media = null;
      media = await tryFetch('saveig', () => fetchSaveig(cleanUrl));
      if (!media) media = await tryFetch('instasave', () => fetchInstasave(cleanUrl));
      if (!media) media = await tryFetch('nyxs', () => fetchNyxs(cleanUrl));
      if (!media) media = await tryFetch('ryzendesu', () => fetchRyzendesu(cleanUrl));
      if (!media) media = await tryFetch('siputzx', () => fetchSiputzx(cleanUrl));

      if (!media || !media.length) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Could not download this Instagram post.\n├ Make sure the link is public and valid.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
      for (const item of media.slice(0, 5)) {
          try {
              const dlRes = await fetch(item.url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.instagram.com/' } });
              if (!dlRes.ok) continue;
              const buf = Buffer.from(await dlRes.arrayBuffer());
              const cap = '╭───(    TOXIC-MD    )───\n├───≫ Iɴsᴛᴀɢʀᴀᴍ Dʟ ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';
              if (item.type === 'video') {
                  await client.sendMessage(m.chat, { video: buf, caption: cap }, { quoted: m });
              } else {
                  await client.sendMessage(m.chat, { image: buf, caption: cap }, { quoted: m });
              }
          } catch {}
      }
  };
  