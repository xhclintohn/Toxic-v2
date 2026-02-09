const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    try {
        if (!text) return m.reply(`did you forget your brain at home? where's the tiktok link?\nexample: ${prefix}tt https://vt.tiktok.com/xxxxx`);
        if (!text.includes("tiktok.com")) return m.reply("are you fucking blind? that's not a tiktok link! tiktok links contain 'tiktok.com', you absolute potato.");

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://api.gimita.id/api/downloader/tiktok?url=${encodedUrl}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJ1c2VybmFtZSI6InhoX2NsaW50b24iLCJyb2xlIjoidXNlciIsInN1YnNjcmlwdGlvbl90aWVyIjoiZnJlZSIsImlzcyI6ImdpbWl0YS1hcGkiLCJleHAiOjE3Njk2ODY2NTIsImlhdCI6MTc2OTY4NTc1Mn0.OgVHy66TFuGO_sh3UlKBXAg_NegR-_w3_0rWrJ275Cw"
            }
        });
        const data = await response.json();

        if (!data?.success || !data?.data?.video) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("failed to download that garbage tiktok! either the link is dead or your taste in content is so bad even the api rejected it.");
        }

        const videoUrl = data.data.video.hd || data.data.video.sd;
        const musicUrl = data.data.audio?.url;
        const username = data.data.author?.name || "unknown";
        const stats = data.data.stats || {};

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const videoResponse = await fetch(videoUrl);
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

        const caption = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
───≫ 🔗 TikTok Download ≪───
々 Author : ${username}
々 Views : ${stats.views || "0"}
々 Likes : ${stats.likes || "0"}
々 Comments : ${stats.comments || "0"}
╭───( ✓ )───`;

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
            } catch (audioError) {
                console.log("audio extraction failed:", audioError.message);
            }
        }

    } catch (error) {
        console.error("tiktok error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
───≫ Error ≪───
々 Error : ${error.message}
々 Fix : Try again later
╭───( ✓ )───`);
    }
};
