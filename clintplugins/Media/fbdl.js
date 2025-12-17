const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

    if (!text) {
        return m.reply(formatStylishReply("Idiot drop a Facebook link! Ex: .facebook https://www.facebook.com/reel/2892722884261200"));
    }

    if (!text.includes("facebook.com")) {
        return m.reply(formatStylishReply("That's not a valid Facebook link, you clueless twit! Try again."));
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text.trim());
        const apiUrl = `https://api.fikmydomainsz.xyz/download/facebook?url=${encodedUrl}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.result || !data.result.video || data.result.video.length === 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(formatStylishReply("No video found or API failed. Try another link! 😢"));
        }

        const result = data.result;
        const videoUrl = result.video[0].url;
        const title = result.title || "Facebook Video";
        const duration = result.duration || "Unknown";
        const quality = result.video[0].quality || "HD";

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                video: { url: videoUrl },
                caption: formatStylishReply(
                    `🎥 *Facebook Video Downloaded*\n\n` +
                    `📌 *Title:* ${title}\n` +
                    `⏱ *Duration:* ${duration}\n` +
                    `🎞 *Quality:* ${quality}`
                ),
                gifPlayback: false
            },
            { quoted: m }
        );

    } catch (e) {
        console.error("Facebook DL Error:", e);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(formatStylishReply(`Download failed: ${e.message}\n\nCheck URL or try again later! 🚫`));
    }
};