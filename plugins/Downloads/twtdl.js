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
    const { client, m, text } = context;

    if (!text) {
        return m.reply('╭───(    TOXIC-MD    )───\n├ Drop a Twitter/X link!\n├ Ex: .twitterdl https://x.com/user/status/123\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    if (!text.includes('twitter.com') && !text.includes('x.com')) {
        return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a valid Twitter/X link!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let videoUrl = null;
        let title = 'Twitter/X Video';

        try {
            videoUrl = await cobaltFetch(text);
        } catch {}

        if (!videoUrl) {
            try {
                const encodedUrl = encodeURIComponent(text);
                const response = await fetch(`https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`, {
                    headers: { Accept: 'application/json' }
                });
                const data = await response.json();
                if (data?.status && data?.result?.video?.url) {
                    videoUrl = data.result.video.url;
                    title = data.result.title || title;
                }
            } catch {}
        }

        if (!videoUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├ No video found! API might be down or link is private.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const videoResponse = await fetch(videoUrl);
        if (!videoResponse.ok) throw new Error(`Failed to download: HTTP ${videoResponse.status}`);
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                video: videoBuffer,
                mimetype: 'video/mp4',
                caption: `╭───(    TOXIC-MD    )───\n├───≫ Twitter/X Video ≪───\n├ \n├ ${title}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                gifPlayback: false,
            },
            { quoted: m }
        );
    } catch (e) {
        console.error('Twitter/X download error:', e);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├ Download failed: ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
