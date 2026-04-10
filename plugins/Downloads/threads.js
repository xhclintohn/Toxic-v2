const fetch = require('node-fetch');
  const NEXRAY = 'https://api.nexray.web.id/downloader/threads?url=';

  module.exports = {
      name: 'threads',
      alias: ['threadsdl', 'tdl'],
      run: async (context) => {
          const { client, m, text, prefix } = context;
          if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ Example: ${prefix}threads https://www.threads.net/@user/post/xxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
          if (!text.includes('threads.net')) return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a Threads link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
          try {
              const r = await fetch(NEXRAY + encodeURIComponent(text.trim()), { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
              const d = await r.json();
              if (!d.status || !d.result) throw new Error('Could not fetch Threads media');
              const res = d.result;
              await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
              if (res.video) {
                  await client.sendMessage(m.chat, {
                      video: { url: res.video },
                      caption: `╭───(    TOXIC-MD    )───\n├───≫ Threads Video ≪───\n├ ${res.author || ''}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                      mimetype: 'video/mp4'
                  }, { quoted: m });
              } else if (res.image) {
                  const imgs = Array.isArray(res.image) ? res.image : [res.image];
                  for (const img of imgs.slice(0, 5)) {
                      await client.sendMessage(m.chat, {
                          image: { url: img },
                          caption: `╭───(    TOXIC-MD    )───\n├───≫ Threads Image ≪───\n├ ${res.author || ''}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                      }, { quoted: m });
                  }
              } else throw new Error('No media found in this Threads post');
          } catch (e) {
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              m.reply(`╭───(    TOXIC-MD    )───\n├ Failed: ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
          }
      }
  };
  