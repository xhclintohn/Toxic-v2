const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

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
        return m.reply("Provide an Instagram link for the video.");
    }

    if (!text.includes("instagram.com")) {
        return m.reply("That is not a valid Instagram link.");
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/igdl?url=${encodedUrl}`,
            {
                headers: { Accept: "application/json" },
                timeout: 15000 // Increased timeout to 15 seconds
            }
        );

        const data = await response.json();

        if (!data || !data.status || !data.data || !data.data[0] || !data.data[0].url) {
            return m.reply("We are sorry but the API endpoint didn't respond correctly. Try again later.");
        }

        const igVideoUrl = data.data[0].url;
        const title = data.data[0].url.match(/filename=([^&]+)/)?.[1]?.replace(/%20/g, " ") || "No title available";

        if (!igVideoUrl) {
            return m.reply("Invalid Instagram data. Please ensure the video exists.");
        }

        const videoResponse = await fetchWithRetry(igVideoUrl, { timeout: 15000 });
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
        m.reply(`An error occurred. API might be down or slow. Error: ${e.message}`);
    }
};