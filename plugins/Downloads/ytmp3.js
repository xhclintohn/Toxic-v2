const fetch = require('node-fetch');

async function cobaltAudio(url) {
    const res = await fetch('https://api.cobalt.tools/', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, downloadMode: 'audio', audioFormat: 'mp3' })
    });
    if (!res.ok) throw new Error(`cobalt ${res.status}`);
    const d = await res.json();
    if (d.status === 'stream' || d.status === 'redirect' || d.status === 'tunnel') return d.url;
    throw new Error(d.error?.code || 'cobalt no audio URL');
}

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ You forgot the YouTube link, ${m.pushName}.\n├ Can you even follow simple instructions?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞᷊ᴅ 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?[a-zA-Z0-9_-]{11})/gi);
    if (!urls) return m.reply('╭───(    TOXIC-MD    )───\n├ That\'s not a valid YouTube link. Learn how URLs work.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let audioUrl = null;
        let title = 'Audio';

        try {
            audioUrl = await cobaltAudio(text);
        } catch {}

        if (!audioUrl) {
            try {
                const encodedUrl = encodeURIComponent(text);
                const response = await fetch(`https://api.sidycoders.xyz/api/ytdl?url=${encodedUrl}&format=mp3&apikey=memberdycoders`, {
                    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
                });
                const data = await response.json();
                if (data.status && data.cdn) {
                    audioUrl = data.cdn;
                    title = data.title || title;
                }
            } catch {}
        }

        if (!audioUrl) {
            try {
                const ytdl = require('ytdl-core');
                const info = await ytdl.getInfo(text);
                const format = ytdl.chooseFormat(info.formats, { filter: 'audioonly', quality: 'highestaudio' });
                audioUrl = format.url;
                title = info.videoDetails.title;
            } catch {}
        }

        if (!audioUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply('╭───(    TOXIC-MD    )───\n├ All download methods failed. Try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title.substring(0, 30),
                    body: 'Toxic-MD',
                    sourceUrl: text,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                },
            },
        }, { quoted: m });

        await client.sendMessage(m.chat, {
            document: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
            caption: `╭───(    TOXIC-MD    )───\n├───≫ YTMP3 ≪───\n├ \n├ ${title}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });

    } catch (error) {
        console.error('ytmp3 error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ YTMP3 ERROR ≪───\n├ \n├ Both download methods failed.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
