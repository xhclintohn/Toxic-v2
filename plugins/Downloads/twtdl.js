const fetch = require('node-fetch');
  const NEXRAY = 'https://api.nexray.web.id/downloader/twitter?url=';

  module.exports = async (context) => {
      const { client, m, text, prefix } = context;
      if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ Example: ${prefix}twitter https://x.com/user/status/xxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      if (!text.includes('twitter.com') && !text.includes('x.com') && !text.includes('t.co')) return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a Twitter/X link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
      try {
          const r = await fetch(NEXRAY + encodeURIComponent(text.trim()), { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
          const d = await r.json();
          if (!d.status || !d.result) throw new Error('API failed');
          const { title, duration, download_url } = d.result;
          const best = (download_url || []).find(u => u.type === 'mp4') || (download_url || [])[0];
          if (!best?.url) throw new Error('No video found in this tweet');
          const dlRes = await fetch(best.url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 40000 });
          if (!dlRes.ok) throw new Error('Download failed: ' + dlRes.status);
          const buf = Buffer.from(await dlRes.arrayBuffer());
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
          await client.sendMessage(m.chat, {
              video: buf, mimetype: 'video/mp4',
              caption: `╭───(    TOXIC-MD    )───\n├───≫ Twitter/X Video ≪───\n├ ${(title || '').slice(0, 80)}\n├ Duration: ${duration || 'N/A'}\n├ Quality: ${best.resolusi || 'HD'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
          }, { quoted: m });
      } catch (e) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
          m.reply(`╭───(    TOXIC-MD    )───\n├ Failed: ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  