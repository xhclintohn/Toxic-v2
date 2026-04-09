const fetch = require('node-fetch');

  async function tryApi(label, fn) {
      try { return await fn(); } catch (e) { console.error(`[IGDL] ${label} failed:`, e.message); return null; }
  }

  async function ryzendesufetch(url) {
      const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!res.ok) throw new Error(`ryzendesu ${res.status}`);
      const d = await res.json();
      if (!d.data?.[0]?.url) throw new Error('no media');
      return d.data.map(item => ({ url: item.url, type: item.type || 'video' }));
  }

  async function siputzxFetch(url) {
      const res = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!res.ok) throw new Error(`siputzx ${res.status}`);
      const d = await res.json();
      if (!d.data?.[0]?.url) throw new Error('no media');
      return d.data.map(item => ({ url: item.url, type: item.type?.includes('video') ? 'video' : 'image' }));
  }

  async function nyxsFetch(url) {
      const res = await fetch(`https://api.nyxs.pw/dl/ig?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!res.ok) throw new Error(`nyxs ${res.status}`);
      const d = await res.json();
      if (!d.result?.media?.[0]?.url) throw new Error('no media');
      return d.result.media.map(item => ({ url: item.url, type: item.type || 'video' }));
  }

  async function agatzFetch(url) {
      const res = await fetch(`https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 12000
      });
      if (!res.ok) throw new Error(`agatz ${res.status}`);
      const d = await res.json();
      const mediaList = d?.data || d?.result || [];
      if (!Array.isArray(mediaList) || !mediaList.length) throw new Error('no media');
      return mediaList.map(item => ({ url: item.url || item, type: 'video' }));
  }

  module.exports = async (context) => {
      const { client, m, text } = context;

      if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Mɪssɪɴɢ Uʀʟ ≪───\n├ Give me an Instagram link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      if (!text.includes('instagram.com')) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ That\'s not an Instagram link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      let media = null;
      media = await tryApi('ryzendesu', () => ryzendesufetch(text));
      if (!media) media = await tryApi('siputzx', () => siputzxFetch(text));
      if (!media) media = await tryApi('nyxs', () => nyxsFetch(text));
      if (!media) media = await tryApi('agatz', () => agatzFetch(text));

      if (!media || !media.length) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Could not download this Instagram post.\n├ All sources tried and failed.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      }

      try {
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

          for (const item of media.slice(0, 5)) {
              try {
                  const mediaRes = await fetch(item.url, { timeout: 30000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                  if (!mediaRes.ok) continue;
                  const buf = Buffer.from(await mediaRes.arrayBuffer());
                  const isVideo = item.type === 'video';
                  const caption = '╭───(    TOXIC-MD    )───\n├───≫ Iɴsᴛᴀɢʀᴀᴍ Dʟ ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧';
                  if (isVideo) {
                      await client.sendMessage(m.chat, { video: buf, caption }, { quoted: m });
                  } else {
                      await client.sendMessage(m.chat, { image: buf, caption }, { quoted: m });
                  }
              } catch {}
          }
      } catch (err) {
          console.error('[IGDL] send error:', err);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  