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
    throw new Error(d.error?.code || 'cobalt no URL');
}

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├ Where's the Facebook link, you brainless moron?\n├ Example: ${prefix}facebook https://www.facebook.com/reel/xxxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    if (!text.includes('facebook.com') && !text.includes('fb.watch')) {
        return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a Facebook link, you absolute potato!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let videoUrl = null;
        let quality = 'best available';

        try {
            videoUrl = await cobaltFetch(text.trim());
        } catch {}

        if (!videoUrl) {
            try {
                const encodedUrl = encodeURIComponent(text.trim());
                const apiUrl = `https://vinztyty.my.id/download/facebook?url=${encodedUrl}`;
                const response = await fetch(apiUrl);
                const data = await response.json();
                if (data.status && data.result?.length) {
                    const videos = data.result;
                    const v720 = videos.find(v => v.quality?.includes('720p') && v.url && v.url !== '/');
                    const best = v720 || videos.find(v => v.url && v.url !== '/');
                    if (best) { videoUrl = best.url; quality = best.quality || 'SD'; }
                }
            } catch {}
        }

        if (!videoUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├ No video found or API failed. Try another link!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                video: { url: videoUrl },
                caption: `╭───(    TOXIC-MD    )───\n├───≫ FACEBOOK DL ≪───\n├ \n├ Quality: ${quality}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                gifPlayback: false
            },
            { quoted: m }
        );

    } catch (e) {
        console.error('Facebook DL Error:', e);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FB DL ERROR ≪───\n├ \n├ Download crashed harder than your IQ.\n├ ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
