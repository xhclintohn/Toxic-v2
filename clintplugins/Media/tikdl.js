const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, botname, m, text } = context;

    const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, options);
                if (!response.ok) {
                    throw new Error(`API failed with status ${response.status}`);
                }
                return response;
            } catch (error) {
                if (attempt === retries || error.type !== "request-timeout") {
                    throw error;
                }
                console.error(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    };

    try {
        if (!text) return m.reply("Provide a TikTok link for the video.");
        if (!text.includes("tiktok.com")) return m.reply("That is not a valid TikTok link.");

        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`,
            { headers: { Accept: "application/json" }, timeout: 15000 }
        );

        const data = await response.json();

        if (!data || !data.status || !data.result || !data.result.video || !data.result.video.url) {
            return m.reply("We are sorry but the API endpoint didn't respond correctly. Try again later.");
        }

        const tikVideoUrl = data.result.video.url;
        const tikDescription = data.result.title || "No description available";
        const tikAuthor = "Unknown Author"; // No creator field used
        const tikLikes = "N/A"; // API doesn't provide stats
        const tikComments = "N/A";
        const tikShares = "N/A";

        const caption = `🎥 TikTok Video\n\n📌 *Description:* ${tikDescription}\n👤 *Author:* ${tikAuthor}\n❤️ *Likes:* ${tikLikes}\n💬 *Comments:* ${tikComments}\n🔗 *Shares:* ${tikShares}\n\n> Powered by ${botname}`;

        m.reply(`TikTok data fetched successfully! Sending...`);

        const videoResponse = await fetchWithRetry(tikVideoUrl, { timeout: 15000 });
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: HTTP ${videoResponse.status}`);
        }

        const arrayBuffer = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        await client.sendMessage(m.chat, {
            video: videoBuffer,
            mimetype: "video/mp4",
            caption: caption,
        }, { quoted: m });
    } catch (error) {
        console.error("TikTok download error:", error);
        m.reply(`Error: ${error.message}. API might be down or slow.`);
    }
};