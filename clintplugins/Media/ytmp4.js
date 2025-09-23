const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

    const isValidYouTubeUrl = (url) => {
        return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|shorts\/|embed\/)?[A-Za-z0-9_-]{11}(\?.*)?$/.test(url);
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

    if (!text || !isValidYouTubeUrl(text)) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("Yo, drop a valid YouTube URL, fam! 📹 Ex: .ytmp4 https://youtu.be/60ItHLz5WEA") },
            { quoted: m, ad: true }
        );
    }

    try {
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply("Snaggin’ the video for ya, fam! Hold tight! 🔥📽️") },
            { quoted: m, ad: true }
        );

        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`,
            { headers: { Accept: "application/json" }, timeout: 15000 }
        );

        const data = await response.json();

        if (!data || !data.status || !data.result || !data.result.video || !data.result.video.url) {
            return client.sendMessage(
                m.chat,
                { text: formatStylishReply("We are sorry but the API endpoint didn't respond correctly. Try again later.") },
                { quoted: m, ad: true }
            );
        }

        const videoUrl = data.result.video.url;
        const title = data.result.title || "No title available";
        const thumbnailUrl = data.result.thumbnail || `https://i.ytimg.com/vi/${text.match(/[?&]v=([^&]+)/)?.[1]}/hqdefault.jpg` || "https://via.placeholder.com/120x90";

        const videoResponse = await fetchWithRetry(videoUrl, { timeout: 15000 });
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
                fileName: `${title}.mp4`,
                caption: formatStylishReply(`Video (${data.result.video.quality || "HD"})`),
                contextInfo: {
                    externalAdReply: {
                        title: "YouTube Video",
                        body: `Quality: ${data.result.video.quality || "HD"} | Powered by Toxic-MD`,
                        thumbnailUrl,
                        sourceUrl: text,
                        mediaType: 2,
                        renderLargerThumbnail: true,
                    },
                },
            },
            { quoted: m, ad: true }
        );
    } catch (error) {
        console.error("YouTube video download error:", error);
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Check the URL and try again! 😎`) },
            { quoted: m, ad: true }
        );
    }
};