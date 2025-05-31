const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed, no botname set. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you forgotसल the damn YouTube link, you moron! Example: .ytmp3 https://youtube.com/watch?v=whatever\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
    if (!urls) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ That’s not a valid YouTube link, ${m.pushName}, you clueless twit!\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://api.giftedtech.web.id/api/download/ytaudio?apikey=gifted_api_se5dccy&url=${encodedUrl}`;
        const response = await fetch(apiUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!response.ok) {
            throw new Error(`API puked with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.result || !data.result.download_url) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s useless, ${m.pushName}! ${data.msg || 'No audio, you loser.'} Try again, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const { title, download_url: audioUrl, type } = data.result;
        const mimeType = type === 'mp3' ? 'audio/mpeg' : 'audio/mpeg'; // Fallback to audio/mpeg if type is unexpected

        // Verify download_url accessibility
        const urlCheck = await fetch(audioUrl, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!urlCheck.ok) {
            // Fetch media as buffer if direct URL is inaccessible
            const mediaResponse = await fetch(audioUrl, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
            });
            if (!mediaResponse.ok) {
                throw new Error(`Download URL inaccessible, status ${mediaResponse.status}`);
            }
            const mediaBuffer = await mediaResponse.buffer();

            await m.reply(`_Downloading ${title}_`);

            // Try sending audio message with buffer
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        audio: mediaBuffer,
                        fileName: `${title}.mp3`,
                        mimetype: mimeType
                    },
                    { quoted: m }
                );
            } catch (audioError) {
                console.error(`Failed to send audio: ${audioError.message}`);
                throw new Error(`Couldn’t send audio, ${audioError.message}`);
            }

            // Try sending document message with buffer
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        document: mediaBuffer,
                        fileName: `${title}.mp3`,
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

            // Try sending audio message with URL
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        audio: { url: audioUrl },
                        fileName: `${title}.mp3`,
                        mimetype: mimeType
                    },
                    { quoted: m }
                );
            } catch (audioError) {
                console.error(`Failed to send audio: ${audioError.message}`);
                throw new Error(`Couldn’t send audio, ${audioError.message}`);
            }

            // Try sending document message with URL
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        document: { url: audioUrl },
                        fileName: `${title}.mp3`,
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
        console.error(`Error in ytmp3: ${error.message}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! Couldn’t download your stupid audio. Try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};