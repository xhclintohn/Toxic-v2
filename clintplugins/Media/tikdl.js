const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, botname, m, text } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

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

    if (!text) {
        return m.reply(formatStylishReply("Yo, drop a TikTok link, fam! 📹 Ex: .tiktokdl https://vm.tiktok.com/ZMABNTpt6/"));
    }

    if (!text.includes("tiktok.com")) {
        return m.reply(formatStylishReply("That’s not a valid TikTok link, you clueless twit! Try again."));
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`,
            { headers: { Accept: "application/json" }, timeout: 15000 }
        );

        const data = await response.json();

        if (!data || !data.status || !data.result || !data.result.video || !data.result.video.url) {
            return m.reply(formatStylishReply("API’s actin’ shady, no video found! 😢 Try again later."));
        }

        const tikVideoUrl = data.result.video.url;
        const tikDescription = data.result.title || "No description available";
        const tikAuthor = "Unknown Author";
        const tikLikes = "N/A";
        const tikComments = "N/A";
        const tikShares = "N/A";

        const caption = formatStylishReply(`🎥 TikTok Video\n\n📌 *Description:* ${tikDescription}\n👤 *Author:* ${tikAuthor}\n❤️ *Likes:* ${tikLikes}\n💬 *Comments:* ${tikComments}\n🔗 *Shares:* ${tikShares}`);

        m.reply(formatStylishReply("Snaggin’ the TikTok video, fam! Hold tight! 🔥📽️"));

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
        m.reply(formatStylishReply(`Yo, we hit a snag: ${error.message}. Check the URL and try again! 😎`));
    }
};