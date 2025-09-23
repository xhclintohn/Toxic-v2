const fetch = require("node-fetch");
const ytdl = require("ytdl-core");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
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

    if (!botname) {
        return m.reply(formatStylishReply(`Bot’s screwed, no botname set. Yell at your dev, dipshit.`));
    }

    if (!text) {
        return m.reply(formatStylishReply(`Oi, ${m.pushName}, you forgot the damn YouTube link, you moron! Example: .ytmp3 https://youtube.com/watch?v=whatever`));
    }

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?[a-zA-Z0-9_-]{11})/gi);
    if (!urls) {
        return m.reply(formatStylishReply(`That’s not a valid YouTube link, ${m.pushName}, you clueless twit!`));
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const response = await fetchWithRetry(
            `https://api.privatezia.biz.id/api/downloader/alldownload?url=${encodedUrl}`,
            {
                timeout: 15000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Accept": "application/json",
                },
            }
        );

        const data = await response.json();

        if (!data || !data.status || !data.result || !data.result.audio || !data.result.audio.url) {
            throw new Error(`API’s useless, no audio available. Falling back...`);
        }

        const title = data.result.title || "No title available";
        const audioUrl = data.result.audio.url;
        const mimeType = data.result.audio.type === "mp3" ? "audio/mpeg" : "audio/mpeg";
        const quality = data.result.audio.quality || "128kbps";

        // Validate audio URL
        const headResponse = await fetchWithRetry(audioUrl, {
            method: "HEAD",
            timeout: 5000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });
        if (!headResponse.ok || !headResponse.headers.get("content-length") || parseInt(headResponse.headers.get("content-length")) > 16 * 1024 * 1024) {
            console.error(`Invalid or oversized audio file at ${audioUrl}, size: ${headResponse.headers.get("content-length")}`);
            throw new Error(`API audio file’s messed up, switching to backup plan.`);
        }

        await m.reply(formatStylishReply(`Downloading ${title}`));

        // Send audio message
        try {
            await client.sendMessage(
                m.chat,
                {
                    audio: { url: audioUrl },
                    fileName: `${title}.mp3`,
                    mimetype: mimeType,
                },
                { quoted: m }
            );
        } catch (audioError) {
            console.error(`Failed to send audio: ${audioError.message}`);
            throw new Error(`Couldn’t send audio, ${audioError.message}`);
        }

        // Send document message
        try {
            await client.sendMessage(
                m.chat,
                {
                    document: { url: audioUrl },
                    fileName: `${title}.mp3`,
                    mimetype: mimeType,
                },
                { quoted: m }
            );
        } catch (docError) {
            console.error(`Failed to send document: ${docError.message}`);
            throw new Error(`Couldn’t send document, ${docError.message}`);
        }

        // Send caption
        await client.sendMessage(m.chat, { text: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ` }, { quoted: m });
    } catch (error) {
        console.error(`Error in ytmp3: ${error.message}`);

        // Fallback to ytdl-core
        if (error.message.includes("fallback") || error.message.includes("messed up") || error.message.includes("Couldn’t send")) {
            try {
                console.log(`Falling back to ytdl-core for ${text}`);
                const info = await ytdl.getInfo(text);
                const format = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
                const audioUrl = format.url;
                const title = info.videoDetails.title;
                const mimeType = "audio/mpeg";

                await m.reply(formatStylishReply(`API flaked, grabbing ${title} with backup, chill!`));

                // Send audio message
                try {
                    await client.sendMessage(
                        m.chat,
                        {
                            audio: { url: audioUrl },
                            fileName: `${title}.mp3`,
                            mimetype: mimeType,
                        },
                        { quoted: m }
                    );
                } catch (audioError) {
                    console.error(`Fallback audio send failed: ${audioError.message}`);
                    throw new Error(`Fallback audio send failed, ${audioError.message}`);
                }

                // Send document message
                try {
                    await client.sendMessage(
                        m.chat,
                        {
                            document: { url: audioUrl },
                            fileName: `${title}.mp3`,
                            mimetype: mimeType,
                        },
                        { quoted: m }
                    );
                } catch (docError) {
                    console.error(`Fallback document send failed: ${docError.message}`);
                    throw new Error(`Fallback document send failed, ${docError.message}`);
                }

                // Send caption
                await client.sendMessage(m.chat, { text: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ` }, { quoted: m });
                return;
            } catch (fallbackError) {
                console.error(`Fallback error: ${fallbackError.message}`);
                return m.reply(formatStylishReply(`Shit’s really broken: ${fallbackError.message} 😢 Try another link, you whiny prick.`));
            }
        }

        return m.reply(formatStylishReply(`Shit broke, ${m.pushName}! ${error.message} Try again, you pathetic loser.`));
    }
};