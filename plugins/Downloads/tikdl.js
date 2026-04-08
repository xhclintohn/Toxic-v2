const fetch = require("node-fetch");
const { tiktok: mintakeTiktok } = require('mintake');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    try {
        if (!text) return m.reply(`did you forget your brain at home? where's the tiktok link?\nexample: ${prefix}tt https://vt.tiktok.com/xxxxx`);
        if (!text.includes("tiktok.com")) return m.reply("are you fucking blind? that's not a tiktok link! tiktok links contain 'tiktok.com', you absolute potato.");

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let videoUrl = null;
        let musicUrl = null;
        let username = 'unknown';
        let stats = {};

        const encodedUrl = encodeURIComponent(text);
        try {
            const response = await fetch(`https://api.nexray.web.id/downloader/tiktok?url=${encodedUrl}`, { method: "GET" });
            const data = await response.json();
            if (data?.status && data?.result?.data) {
                videoUrl = data.result.data;
                musicUrl = data.result.music_info?.url;
                username = data.result.author?.nickname || 'unknown';
                stats = data.result.stats || {};
            }
        } catch {}

        if (!videoUrl) {
            try {
                const fallback = await mintakeTiktok(text);
                if (fallback?.nowm) {
                    videoUrl = fallback.nowm;
                    if (fallback.audio) musicUrl = fallback.audio;
                } else if (fallback?.wm) {
                    videoUrl = fallback.wm;
                }
            } catch {}
        }

        if (!videoUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("failed to download that garbage tiktok! either the link is dead or your taste in content is so bad even the api rejected it.");
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const videoResponse = await fetch(videoUrl);
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        const caption = `╭───(    TOXIC-MD    )───
├───≫ 🔗 TikTok Download ≪───
├ Author : ${username}
├ Views : ${stats.views || "0"}
├ Likes : ${stats.likes || "0"}
├ Comments : ${stats.comment || "0"}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await client.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: caption
        }, { quoted: m });

        if (musicUrl) {
            try {
                const musicResponse = await fetch(musicUrl);
                const musicBuffer = Buffer.from(await musicResponse.arrayBuffer());
                await client.sendMessage(m.chat, {
                    audio: musicBuffer,
                    mimetype: "audio/mpeg",
                    ptt: false,
                    fileName: `tiktok_audio.mp3`
                });
            } catch {}
        }

    } catch (error) {
        console.error("tiktok error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───
├───≫ Error ≪───
├ Error : ${error.message}
├ Fix : Try again later
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
