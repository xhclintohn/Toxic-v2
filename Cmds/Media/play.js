module.exports = async (context) => {
    const { client, m, text } = context;
    const yts = require("yt-search");
    const fetch = require("node-fetch");

    if (!text) {
        return m.reply("Please provide a song name! 🎵");
    }

    try {
        const { videos } = await yts(text);
        if (!videos || videos.length === 0) {
            throw new Error("No songs found! 😕");
        }

        const song = videos[0];
        const apiKey = "gifted";
        const apiUrl = `https://api.giftedtech.web.id/api/download/dlmp3?apikey=${apiKey}&url=${encodeURIComponent(song.url)}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status} 🚫`);
        }

        const data = await response.json();
        if (!data.success || !data.result?.download_url) {
            throw new Error("Failed to retrieve audio from API! 😞");
        }

        const songTitle = data.result.title || song.title;
        await m.reply(`_Downloading ${songTitle}_ 🎧`);

        await client.sendMessage(m.chat, {
            document: { url: data.result.download_url },
            mimetype: "audio/mp3",
            fileName: `${songTitle}.mp3`
        }, { quoted: m });

    } catch (error) {
        console.error("Error in play command:", error.message);
        return m.reply(`Download failed: ${error.message} 😢`);
    }
};