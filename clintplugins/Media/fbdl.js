const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) {
        return m.reply("Provide a Facebook link for the video.");
    }

    if (!text.includes("facebook.com")) {
        return m.reply("That is not a valid Facebook link.");
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://api.privatezia.biz.id/api/downloader/fbdownload?url=${encodedUrl}`);
        
        if (!response.ok) {
            throw new Error(`API failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.status || !data.data || !data.data.best_quality) {
            return m.reply("We are sorry but the API endpoint didn't respond correctly. Try again later.");
        }

        const fbvid = data.data.best_quality;
        const title = data.data.title || "No title available";

        if (!fbvid) {
            return m.reply("Invalid Facebook data. Please ensure the video exists.");
        }

        await client.sendMessage(
            m.chat,
            {
                video: { url: fbvid },
                caption: `${title}\n\nDownloaded by ${botname} | Created by ${data.creator}`,
                gifPlayback: false,
            },
            { quoted: m }
        );
    } catch (e) {
        console.error("Error occurred:", e);
        m.reply(`An error occurred. API might be down. Error: ${e.message}`);
    }
};