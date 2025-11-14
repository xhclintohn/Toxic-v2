const fetch = require("node-fetch");
const AbortController = require("abort-controller");

module.exports = async (context) => {
    const { client, botname, m, text } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

  
    const fetchWithRetry = async (url, options = {}, retries = 3, delay = 1500) => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);

            try {
                const res = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120.0",
                        Accept: "application/json, text/plain, */*",
                        ...(options.headers || {})
                    }
                });

                clearTimeout(timeout);

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res;

            } catch (err) {
                clearTimeout(timeout);

                if (attempt === retries) throw err;

                console.log(
                    `Retry attempt ${attempt} failed: ${err.message} – retrying in ${delay}ms`
                );
                await new Promise(r => setTimeout(r, delay));
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

        const metadataResponse = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`,
            { timeout: 15000 }
        );

        const data = await metadataResponse.json();

        if (!data?.status || !data?.result?.video?.url) {
            return m.reply(formatStylishReply("API acting shady, no video found! 😢 Try later."));
        }

        const videoUrl = data.result.video.url;
        const tikDescription = data.result.title || "No description available";

        const caption = formatStylishReply(`🎥 TikTok Video\n\n📌 *Description:* ${tikDescription}`);

        m.reply(formatStylishReply("Snaggin’ the TikTok video, fam! Hold tight! 🔥📽️"));

        // Download video with retries + timeout
        const videoRes = await fetchWithRetry(videoUrl, { timeout: 20000 });
        const buffer = Buffer.from(await videoRes.arrayBuffer());

        await client.sendMessage(
            m.chat,
            {
                video: buffer,
                mimetype: "video/mp4",
                caption
            },
            { quoted: m }
        );

    } catch (error) {
        console.error("TikTok download error:", error);
        m.reply(formatStylishReply(`Yo, we hit a snag: ${error.message}. Try again! 😎`));
    }
};