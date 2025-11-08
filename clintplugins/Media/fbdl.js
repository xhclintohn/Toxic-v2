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
        return m.reply(formatStylishReply("That's not a valid Facebook link, you clueless twit! Try again."));
    }

    try {
        const encodedUrl = encodeURIComponent(text.trim());
        const apiUrl = `https://api.fikmydomainsz.xyz/download/facebook?url=${encodedUrl}`;

        const response = await fetchWithRetry(apiUrl, {
            headers: { Accept: "application/json" },
            timeout: 20000
        });

        const data = await response.json();

        // Validate API response
        if (!data.status || !data.result || !data.result.video || data.result.video.length === 0) {
            return m.reply(formatStylishReply("No video found or API failed. Try another link! 😢"));
        }

        const result = data.result;

        // Prefer 720p HD, fallback to highest available
        let videoUrl = result.media; // fallback to base media
        const hdVideo = result.video.find(v => v.quality.includes("720p"));
        if (hdVideo) videoUrl = hdVideo.url;

        const title = result.title || "Facebook Video";
        const duration = result.duration || "Unknown";
        const thumbnail = result.thumbnail || null;

        // Send video
        await client.sendMessage(
            m.chat,
            {
                video: { url: videoUrl },
                caption: formatStylishReply(
                    `🎥 *Facebook Video Downloaded*\n\n` +
                    `📌 *Title:* ${title}\n` +
                    `⏱ *Duration:* ${duration}\n` +
                    `🎞 *Quality:* HD Preferred\n` +
                    `📥 Powered by Toxic-MD`
                ),
                gifPlayback: false,
                jpegThumbnail: thumbnail ? await (await fetch(thumbnail)).buffer() : null
            },
            { quoted: m }
        );

    } catch (e) {
        console.error("FikXzMods FB DL Error:", e);
        m.reply(formatStylishReply(`Download failed: ${e.message}\n\nCheck URL or try again later! 🚫`));
    }
};