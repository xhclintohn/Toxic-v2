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
        return m.reply("Provide a Facebook link for the video.");
    }

    if (!text.includes("facebook.com")) {
        return m.reply("That is not a valid Facebook link.");
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`,
            { headers: { Accept: "application/json" }, timeout: 15000 }
        );

        const data = await response.json();

        if (!data || !data.status || !data.result || !data.result.video || !data.result.video.url) {
            return m.reply("We are sorry but the API endpoint didn't respond correctly. Try again later.");
        }

        const fbvid = data.result.video.url;
        const title = data.result.title || "No title available";

        if (!fbvid) {
            return m.reply("Invalid Facebook data. Please ensure the video exists.");
        }

        await client.sendMessage(
            m.chat,
            {
                video: { url: fbvid },
                caption: `🎥 Facebook Video\n\n📌 *Title:* ${title}\n\n> Downloaded by ${botname}`,
                gifPlayback: false,
            },
            { quoted: m }
        );
    } catch (e) {
        console.error("Facebook download error:", e);
        m.reply(`An error occurred. API might be down or slow. Error: ${e.message}`);
    }
};