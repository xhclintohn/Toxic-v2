const fetch = require('node-fetch');

async function cobaltFetch(url) {
    const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, downloadMode: 'auto' })
    });
    if (!res.ok) throw new Error(`cobalt ${res.status}`);
    const d = await res.json();
    if (d.status === 'stream' || d.status === 'redirect' || d.status === 'tunnel') return d.url;
    if (d.status === 'picker' && d.picker?.length) return d.picker[0].url;
    throw new Error(d.error?.code || 'cobalt returned no URL');
}

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Mɪssɪɴɢ Uʀʟ ≪───\n├ Give me an Instagram link, you social media addict.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        if (!text.includes('instagram.com')) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ That\'s not an Instagram link. Are your eyes broken?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        let mediaUrl = null;
        let mediaType = 'video';

        try {
            mediaUrl = await cobaltFetch(text);
        } catch {}

        if (!mediaUrl) {
            const fallbackApis = [
                () => fetch(`https://api.siputzx.my.id/api/d/igdl?url=${encodedUrl}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json()),
                () => fetch(`https://api.nyxs.pw/dl/igdl?url=${encodedUrl}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json()),
                () => fetch(`https://api.agatz.xyz/api/instagramv2?url=${encodedUrl}`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json()),
                () => fetch(`https://api.betabotz.eu.org/api/download/instagram?url=${encodedUrl}&apikey=null`, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.json()),
            ];

            const extractMedia = (data) => {
                if (!data) return null;
                const candidates = [
                    data?.result?.[0]?.url,
                    data?.result?.[0]?.url_download,
                    data?.data?.[0]?.url,
                    data?.medias?.[0]?.url,
                    data?.url,
                    Array.isArray(data?.result) ? data.result[0]?.url : null,
                    Array.isArray(data?.data) ? data.data[0]?.url : null,
                ];
                return candidates.find(u => u && typeof u === 'string') || null;
            };

            for (const callApi of fallbackApis) {
                try {
                    const data = await callApi();
                    const found = extractMedia(data);
                    if (found) { mediaUrl = found; break; }
                } catch {}
            }
        }

        if (!mediaUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Instagram download failed.\n├ Post is private, deleted, or\n├ all APIs are temporarily down.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const isImage = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(mediaUrl);
        mediaType = isImage ? 'image' : 'video';

        const caption = `╭───(    TOXIC-MD    )───\n├───≫ Iɴsᴛᴀɢʀᴀᴍ Dᴏᴡɴʟᴏᴀᴅ ≪───\n├ Type: ${isImage ? 'Image' : 'Video'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (isImage) {
            await client.sendMessage(m.chat, { image: { url: mediaUrl }, caption }, { quoted: m });
        } else {
            await client.sendMessage(m.chat, { video: { url: mediaUrl }, mimetype: 'video/mp4', caption, gifPlayback: false }, { quoted: m });
        }

    } catch (error) {
        console.error('Instagram error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Instagram download crashed.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
