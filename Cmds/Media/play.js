module.exports = async (context) => {
    const { client, m, text } = context;
    const yts = require("yt-search");
    const fetch = require("node-fetch");

    // Function to format stylish reply
    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
    };

    if (!text) {
        return m.reply(formatStylishReply("Yo, you forgot to give me a song name! 🎵 Try again."));
    }

    try {
        const { videos } = await yts(text);
        if (!videos || videos.length === 0) {
            throw new Error("Couldn't find any songs matching that. 😕 Wanna try another?");
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
            throw new Error("Something went wrong with the download server. 🚫 Let's try again later.");
        }

        const data = await response.json();
        if (!data.success || !data.result?.download_url) {
            throw new Error("Ugh, couldn't grab the audio from the server. 😞 Any other song you want?");
        }

        const songTitle = data.result.title || song.title;
        await m.reply(formatStylishReply(`Grabbing *${songTitle}* for you! 🎧 Hang tight.`));

        await client.sendMessage(m.chat, {
            document: { url: data.result.download_url },
            mimetype: "audio/mp3",
            fileName: `${songTitle}.mp3`
        }, { quoted: m });

    } catch (error) {
        console.error("Error in play command:", error.message);
        return m.reply(formatStylishReply(`Oops, something broke: ${error.message} 😢 Wanna try another song?`));
    }
};