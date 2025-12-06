const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

    const fetchWithRetry = async (url, options = {}, retries = 3, delay = 2000) => {
        const defaultOptions = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.instagram.com/',
                'DNT': '1'
            },
            timeout: 30000
        };

        const finalOptions = { ...defaultOptions, ...options };

        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`Attempt ${attempt} for: ${url}`);
                const response = await fetch(url, finalOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return response;
            } catch (error) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                
                if (attempt === retries) {
                    throw error;
                }
                
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 1.5; // Exponential backoff
            }
        }
    };

    if (!text) {
        return m.reply(formatStylishReply("Yo, drop an Instagram link, fam! 📹 Ex: .instagramdl https://www.instagram.com/reel/DOlTuNlExm/"));
    }

    if (!text.includes("instagram.com")) {
        return m.reply(formatStylishReply("That's not a valid Instagram link! Try again."));
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        // CHANGED API ONLY - using the new fikmydomainsz.xyz API
        const apiUrl = `https://api.fikmydomainsz.xyz/download/instagram?url=${encodedUrl}`;
        
        console.log("Fetching from API:", apiUrl);
        
        const response = await fetchWithRetry(apiUrl);
        const data = await response.json();

        // UPDATED: Check for new API response format
        if (!data?.status || !data?.result?.[0]?.url_download) {
            return m.reply(formatStylishReply("API returned no video! The link might be private or invalid."));
        }

        // UPDATED: Get video URL from new API response format
        const igVideoUrl = data.result[0].url_download;
        
        // Use title from API or default
        const title = "Instagram Video"; // You can extract title if available in new API

        console.log("Video URL found:", igVideoUrl);

        // Send video using the URL (no changes to this part)
        await client.sendMessage(
            m.chat,
            {
                video: { url: igVideoUrl },
                mimetype: "video/mp4",
                caption: formatStylishReply(`🎥 Instagram Video\n\n📌 *Title:* ${title}`),
                gifPlayback: false,
            },
            { quoted: m }
        );

    } catch (error) {
        console.error("Instagram download error:", error);
        
        let errorMessage = "Failed to download video. ";
        
        if (error.message.includes("timeout")) {
            errorMessage += "Request timed out. The video might be too large.";
        } else if (error.message.includes("404") || error.message.includes("403")) {
            errorMessage += "Video not found or access denied.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
            errorMessage += "Network error. Check your connection.";
        } else {
            errorMessage += error.message;
        }
        
        m.reply(formatStylishReply(errorMessage));
    }
};