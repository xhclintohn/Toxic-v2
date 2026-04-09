const fetch = require('node-fetch');

async function cobaltFetch(url) {
    const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, downloadMode: 'auto' })
    });
    if (!res.ok) throw new Error(`cobalt ${res.status}`);
    const d = await res.json();
    if (d.status === 'stream' || d.status === 'redirect' || d.status === 'tunnel') return { url: d.url, isVideo: true };
    if (d.status === 'picker' && d.picker?.length) return { url: d.picker[0].url, isVideo: d.picker[0].type !== 'photo' };
    throw new Error(d.error?.code || 'cobalt no URL');
}

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) return m.reply('╭───(    TOXIC-MD    )───\n├ Please provide a link to download\n├ Supports: YouTube, TikTok, Instagram, Twitter, Facebook, Reddit\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let mediaUrl = null;
        let isVideo = true;

        try {
            const cobalt = await cobaltFetch(text);
            mediaUrl = cobalt.url;
            isVideo = cobalt.isVideo;
        } catch {}

        if (!mediaUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├ Failed to download media\n├ Link might be invalid, private, or unsupported\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const caption = `╭───(    TOXIC-MD    )───
├───≫ Media Downloader ≪───
├ Downloaded By : ${botname || 'Toxic-MD'}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (!isVideo) {
            await client.sendMessage(m.chat, { image: { url: mediaUrl }, caption }, { quoted: m });
        } else {
            await client.sendMessage(m.chat, { video: { url: mediaUrl }, caption, gifPlayback: false }, { quoted: m });
        }

    } catch (error) {
        console.error('AllDL Error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply('╭───(    TOXIC-MD    )───\n├ An error occurred\n├ ' + error.message + '\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }
};
