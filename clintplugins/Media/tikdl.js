const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, botname, m, text } = context;

    const fetchTikTokData = async (url, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API failed with status ${response.status}`);
            }
            const data = await response.json();
            if (
                data &&
                data.status === true &&
                data.data &&
                data.data.no_watermark &&
                data.data.title
            ) {
                return data;
            }
        }
        throw new Error("Failed to fetch valid TikTok data after multiple attempts.");
    };

    try {
        if (!text) return m.reply("Provide a TikTok link for the video.");
        if (!text.includes("tiktok.com")) return m.reply("That is not a valid TikTok link.");

        const encodedUrl = encodeURIComponent(text);
        const url = `https://api.privatezia.biz.id/api/downloader/tiktok?url=${encodedUrl}`;
        const data = await fetchTikTokData(url);

        const tikVideoUrl = data.data.no_watermark;
        const tikDescription = data.data.title || "No description available";
        const tikAuthor = data.creator || "Unknown Author";
        // Since the new API doesn't provide stats, we'll use placeholders or omit them
        const tikLikes = "N/A";
        const tikComments = "N/A";
        const tikShares = "N/A";

        const caption = `🎥 TikTok Video\n\n📌 *Description:* ${tikDescription}\n👤 *Author:* ${tikAuthor}\n❤️ *Likes:* ${tikLikes}\n💬 *Comments:* ${tikComments}\n🔗 *Shares:* ${tikShares}\n\n> Powered by ${botname}`;

        m.reply(`TikTok data fetched successfully! Sending...`);

        const response = await fetch(tikVideoUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        await client.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: caption,
        }, { quoted: m });

    } catch (error) {
        m.reply(`Error: ${error.message}`);
    }
};