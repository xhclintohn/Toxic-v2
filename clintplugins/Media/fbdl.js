const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

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
        return m.reply(formatStylishReply("Yo, drop a Facebook link, fam! 📹 Ex: .facebookdl https://www.facebook.com/reel/2892722884261200"));
    }

    if (!text.includes("facebook.com")) {
        return m.reply(formatStylishReply("That’s not a valid Facebook link, you clueless twit! Try again."));
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/fbdownload?url=${encodedUrl}`,
            { headers: { Accept: "application/json" }, timeout: 15000 }
        );

        const data = await response.json();

        // Check if the API response is valid and contains the expected data
        if (!data || !data.status || !data.data || !data.data.downloads || data.data.downloads.length === 0) {
            return m.reply(formatStylishReply("API’s actin’ shady, no video found! 😢 Try again later."));
        }

        // Extract the best quality video URL
        const fbvid = data.data.best_quality || data.data.downloads.find(d => d.quality === "720p (HD)")?.url;
        const title = data.data.title || "No title available";
        const thumbnail = data.data.thumbnail || null;

        if (!fbvid) {
            return m.reply(formatStylishReply("Invalid Facebook video data. Make sure the video exists, fam!"));
        }

        // Send the video with a caption
        await client.sendMessage(
            m.chat,
            {
                video: { url: fbvid },
                caption: formatStylishReply(`🎥 Facebook Video\n\n📌 *Title:* ${title}\n📸 *Thumbnail:* ${thumbnail || "Not available"}`),
                gifPlayback: false,
            },
            { quoted: m }
        );
    } catch (e) {
        console.error("Facebook download error:", e);
        m.reply(formatStylishReply(`Yo, we hit a snag: ${e.message}. Check the URL and try again! 😎`));
    }
};