const fetch = require('node-fetch');
  const ytdl = require('ytdl-core');

  function streamToBuffer(stream) {
      return new Promise((resolve, reject) => {
          const chunks = [];
          stream.on('data', c => chunks.push(c));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
      });
  }

  async function searchYT(query) {
      const pipedInstances = [
          'https://pipedapi.kavin.rocks',
          'https://piped-api.garudalinux.org',
          'https://api.piped.yt'
      ];
      for (const base of pipedInstances) {
          try {
              const res = await fetch(`${base}/search?q=${encodeURIComponent(query)}&filter=videos`, {
                  headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000
              });
              if (!res.ok) continue;
              const d = await res.json();
              if (!d.items?.length) continue;
              const v = d.items[0];
              const videoId = (v.url || '').replace('/watch?v=', '');
              return {
                  url: `https://www.youtube.com/watch?v=${videoId}`,
                  title: v.title || query,
                  duration: v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '',
                  views: v.views ? v.views.toLocaleString() : '',
                  thumbnail: v.thumbnail || ''
              };
          } catch {}
      }
      throw new Error('All search sources failed');
  }

  module.exports = {
      name: 'play',
      aliases: ['ply', 'playy', 'pl'],
      description: 'Downloads songs from YouTube and sends audio',
      run: async (context) => {
          const { client, m, text } = context;

          try {
              const query = text ? text.trim() : '';

              if (!query) return m.reply(`╭───(    TOXIC-MD    )───\n├ You forgot to type something, genius.\n├ Give me a song name OR a YouTube link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

              await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

              let ytUrl = query;
              let title = query;
              let duration = '';
              let views = '';
              let thumbnail = '';

              const isYtUrl = /(?:youtube\.com|youtu\.be)/i.test(query);

              if (!isYtUrl) {
                  try {
                      const result = await searchYT(query);
                      ytUrl = result.url;
                      title = result.title;
                      duration = result.duration;
                      views = result.views;
                      thumbnail = result.thumbnail;
                  } catch {}
              }

              const info = await ytdl.getInfo(ytUrl);
              if (!title || title === query) title = info.videoDetails.title;
              if (!duration) {
                  const secs = Number(info.videoDetails.lengthSeconds);
                  duration = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
              }

              const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
              if (!format) throw new Error('No audio format found');

              const audioStream = ytdl(ytUrl, { format });
              const audioBuf = await streamToBuffer(audioStream);
              const mimeType = format.container === 'mp4' ? 'audio/mp4' : 'audio/ogg; codecs=opus';

              await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

              await client.sendMessage(m.chat, {
                  audio: audioBuf,
                  mimetype: mimeType,
                  ptt: false,
                  fileName: `${title.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
                  contextInfo: thumbnail ? {
                      externalAdReply: {
                          title: title.substring(0, 30),
                          body: `Toxic-MD • ${duration} • ${views} views`,
                          thumbnailUrl: thumbnail,
                          sourceUrl: ytUrl,
                          mediaType: 1,
                          renderLargerThumbnail: true
                      }
                  } : undefined
              }, { quoted: m });

              await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PLAY ≪───\n├ \n├ ${title}\n├ ⏱️ ${duration} | 📺 ${views || '?'} views\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

          } catch (error) {
              console.error('Play error:', error);
              await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
              await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PLAY ERROR ≪───\n├ \n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
          }
      }
  };
  