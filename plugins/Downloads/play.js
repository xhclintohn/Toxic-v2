const fetch = require('node-fetch');

async function searchYT(query) {
    const res = await fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!res.ok) throw new Error(`piped ${res.status}`);
    const d = await res.json();
    if (!d.items?.length) throw new Error('no results');
    const v = d.items[0];
    const videoId = (v.url || '').replace('/watch?v=', '');
    return {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title: v.title || query,
        duration: v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '',
        views: v.views ? v.views.toLocaleString() : '',
        thumbnail: v.thumbnail || ''
    };
}

async function cobaltAudio(ytUrl) {
    const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: ytUrl, downloadMode: 'audio', audioFormat: 'mp3' })
    });
    if (!res.ok) throw new Error(`cobalt ${res.status}`);
    const d = await res.json();
    if (d.status === 'stream' || d.status === 'redirect' || d.status === 'tunnel') return d.url;
    throw new Error(d.error?.code || 'cobalt no audio URL');
}

module.exports = {
    name: 'play',
    aliases: ['ply', 'playy', 'pl'],
    description: 'Downloads songs from YouTube and sends audio',
    run: async (context) => {
        const { client, m, text } = context;

        try {
            const query = text ? text.trim() : '';

            if (!query) {
                return m.reply(`╭───(    TOXIC-MD    )───\n├ You forgot to type something, genius.\n├ Give me a song name OR a YouTube link.\n├ Example: .play funk universo\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

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

            let audioUrl = null;

            try {
                audioUrl = await cobaltAudio(ytUrl);
            } catch {}

            if (!audioUrl) {
                try {
                    const ytdl = require('ytdl-core');
                    const info = await ytdl.getInfo(ytUrl);
                    const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
                    audioUrl = format.url;
                    title = info.videoDetails.title;
                } catch {}
            }

            if (!audioUrl) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`╭───(    TOXIC-MD    )───\n├ No audio found for "${query}".\n├ Your music taste is as bad as your search skills.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await client.sendMessage(m.chat, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                contextInfo: thumbnail ? {
                    externalAdReply: {
                        title: title.substring(0, 30),
                        body: `Toxic-MD • ${duration} • ${views} views`,
                        thumbnailUrl: thumbnail,
                        sourceUrl: ytUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true,
                    },
                } : undefined,
            }, { quoted: m });

            await client.sendMessage(m.chat, {
                document: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${title.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
                caption: `╭───(    TOXIC-MD    )───\n├───≫ PLAY ≪───\n├ \n├ *${title}*\n├ ⏱️ ${duration} | 📺 ${views} views\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });

        } catch (error) {
            console.error('Play error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PLAY ERROR ≪───\n├ \n├ Play failed. The universe rejects your music taste.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
