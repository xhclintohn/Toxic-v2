const axios = require('axios');
const fetch = require('node-fetch');
const { GIFTED_API_KEY_FALLBACK } = require('../../keys');

const box = (title, lines) => {
    const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

const KEY = () => GIFTED_API_KEY_FALLBACK || 'gifted';

async function fetchYT(endpoint, url) {
    const res = await axios.get(`https://api.giftedtech.co.ke/api/download/${endpoint}`, {
        params: { url, apikey: KEY() },
        timeout: 30000
    });
    return res.data;
}

async function downloadBuffer(url) {
    const res = await fetch(url, { timeout: 60000 });
    if (!res.ok) throw new Error('download failed');
    return await res.buffer();
}

module.exports = [
    {
        name: 'gytmp3',
        aliases: ['gyta', 'gmp3', 'gytaudio'],
        run: async (context) => {
            const { client, m, text, prefix } = context;
            if (!text) return m.reply(box('YT AUDIO', [`Usage: ${prefix}gytmp3 <YouTube URL>`]));
            try {
                await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
                const data = await fetchYT('ytmp3', text.trim());
                if (!data?.success || !data?.result?.download_url) throw new Error('failed');
                const { title, quality, download_url } = data.result;
                await client.sendMessage(m.chat, {
                    text: box('YT AUDIO', [
                        `🎵 ${title || 'Audio'}`,
                        `📊 Quality: ${quality || '128kbps'}`,
                        `⏳ Downloading...`
                    ])
                }, { quoted: m });
                const buf = await downloadBuffer(download_url);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                await client.sendMessage(m.chat, {
                    audio: buf,
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `${title || 'audio'}.mp3`
                }, { quoted: m });
            } catch {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                m.reply(box('YT AUDIO', ['Something went wrong. Check the URL and try again.']));
            }
        }
    },
    {
        name: 'gytmp4',
        aliases: ['gytv', 'gmp4', 'gytvideo'],
        run: async (context) => {
            const { client, m, text, prefix } = context;
            if (!text) return m.reply(box('YT VIDEO', [`Usage: ${prefix}gytmp4 <YouTube URL>`]));
            try {
                await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
                const data = await fetchYT('ytmp4', text.trim());
                if (!data?.success || !data?.result?.download_url) throw new Error('failed');
                const { title, quality, download_url } = data.result;
                await client.sendMessage(m.chat, {
                    text: box('YT VIDEO', [
                        `🎬 ${title || 'Video'}`,
                        `📊 Quality: ${quality || 'HD'}`,
                        `⏳ Downloading...`
                    ])
                }, { quoted: m });
                const buf = await downloadBuffer(download_url);
                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                await client.sendMessage(m.chat, {
                    video: buf,
                    mimetype: 'video/mp4',
                    caption: box('YT VIDEO', [`🎬 ${title || 'Video'}`]),
                    fileName: `${title || 'video'}.mp4`
                }, { quoted: m });
            } catch {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                m.reply(box('YT VIDEO', ['Something went wrong. Check the URL and try again.']));
            }
        }
    }
];
