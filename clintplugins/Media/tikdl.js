const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    try {
        if (!text) return m.reply(`Did you forget your brain at home? Where's the TikTok link?\nExample: ${prefix}tt https://vt.tiktok.com/xxxxx`);
        if (!text.includes("tiktok.com")) return m.reply("Are you fucking blind? That's not a TikTok link! TikTok links contain 'tiktok.com', you absolute potato.");

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://z7.veloria.my.id/download/tiktok?url=${encodedUrl}`);
        const data = await response.json();

        if (!data?.status || !data?.result?.video_nowm) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("Failed to download that garbage TikTok! Either the link is dead or your taste in content is so bad even the API rejected it.");
        }

        const videoUrl = data.result.video_nowm;
        const videoResponse = await fetch(videoUrl);
        const arrayBuffer = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: "Here's your braindead TikTok video. Don't waste my time with more garbage."
        }, { quoted: m });

    } catch (error) {
        console.error("TikTok error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`The fuck? TikTok download crashed harder than your IQ.\nError: ${error.message}\nTry again or go touch grass.`);
    }
};