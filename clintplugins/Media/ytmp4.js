const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed, no botname set. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you forgot the damn YouTube link, you moron! Example: .ytmp4 https://youtube.com/watch?v=whatever\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
    if (!urls) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ That’s not a valid YouTube link, ${m.pushName}, you clueless twit!\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://api.giftedtech.web.id/api/download/ytvid?apikey=gifted_api_se5dccy&url=${encodedUrl}`;
        const response = await fetch(apiUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!response.ok) {
            throw new Error(`API puked with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.result || !data.result.download_url) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s useless, ${m.pushName}! ${data.msg || 'No video, you loser.'} Try again, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const { title, download_url: videoUrl, type } = data.result;
        const mimeType = type === 'mp4' ? 'video/mp4' : 'video/mp4'; // Fallback to video/mp4 if type is unexpected

        // Verify download_url accessibility
        const urlCheck = await fetch(videoUrl, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!urlCheck.ok) {
            // Fetch media as buffer if direct URL is inaccessible
            const mediaResponse = await fetch(videoUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });
            if (!mediaResponse.ok) {
                throw new Error(`Download URL inaccessible, status ${mediaResponse.status}`);
            }
            const mediaBuffer = await mediaResponse.buffer();

            await m.reply(`_Downloading ${title}_`);

            // Try sending video message with buffer
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        video: mediaBuffer,
                        fileName: `${title}.mp4`,
                        mimetype: mimeType
                    },
                    { quoted: m }
                );
            } catch (videoError) {
                console.error(`Failed to send video: ${videoError.message}`);
                throw new Error(`Couldn’t send video, ${videoError.message}`);
            }

            // Try sending document message with buffer
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        document: mediaBuffer,
                        fileName: `${title}.mp4`,
                        mimetype: mimeType
                    },
                    { quoted: m }
                );
            } catch (docError) {
                console.error(`Failed to send document: ${docError.message}`);
                throw new Error(`Couldn’t send document, ${docError.message}`);
            }
        } else {
            await m.reply(`_Downloading ${title}_`);

            // Try sending video message with URL
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        video: { url: videoUrl },
                        fileName: `${title}.mp4`,
                        mimetype: mimeType
                    },
                    { quoted: m }
                );
            } catch (videoError) {
                console.error(`Failed to send video: ${videoError.message}`);
                throw new Error(`Couldn’t send video, ${videoError.message}`);
            }

            // Try sending document message with URL
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        document: { url: videoUrl },
                        fileName: `${title}.mp4`,
                        mimetype: mimeType
                    },
                    { quoted: m }
                );
            } catch (docError) {
                console.error(`Failed to send document: ${docError.message}`);
                throw new Error(`Couldn’t send document, ${docError.message}`);
            }
        }

        // Send caption
        await client.sendMessage(m.chat, { text: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ` }, { quoted: m });
    } catch (error) {
        console.error(`Error in ytmp4: ${error.message}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! Couldn’t download your stupid video. Try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};