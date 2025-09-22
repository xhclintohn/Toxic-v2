const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) {
        return m.reply("Provide an Instagram link for the video.");
    }

    if (!text.includes("instagram.com")) {
        return m.reply("That is not a valid Instagram link.");
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://api.privatezia.biz.id/api/downloader/igdl?url=${encodedUrl}`, {
            headers: { Accept: "application/json" },
            timeout: 10000
        });

        if (!response.ok) {
            throw new Error(`API failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.status || !data.data || !data.data[0] || !data.data[0].url) {
            return m.reply("We are sorry but the API endpoint didn't respond correctly. Try again later.");
        }

        const igVideoUrl = data.data[0].url;
        // Extract title from filename if available, or use fallback
        const title = data.data[0].url.match(/filename=([^&]+)/)?.[1]?.replace(/%20/g, " ") || "No title available";

        if (!igVideoUrl) {
            return m.reply("Invalid Instagram data. Please ensure the video exists.");
        }

        const videoResponse = await fetch(igVideoUrl);
        if (!videoResponse.ok) {
            throw new Error(`Failed to download video: HTTP ${videoResponse.status}`);
        }

        const arrayBuffer = await videoResponse.arrayBuffer();
        const videoBuffer = Buffer.from(arrayBuffer);

        await client.sendMessage(
            m.chat,
            {
                video: videoBuffer,
                mimetype: "video/mp4",
                caption: `🎥 Instagram Video\n\n📌 *Title:* ${title}\n👤 *Creator:* ${data.creator}\n\n> Downloaded by ${botname}`,
                gifPlayback: false,
            },
            { quoted: m }
        );
    } catch (e) {
        console.error("Instagram download error:", e);
        m.reply(`An error occurred. API might be down. Error: ${e.message}`);
    }
};