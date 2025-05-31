const fetch = require('node-fetch');
const ytdl = require('ytdl-core');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
    };

    if (!botname) {
        return m.reply(formatStylishReply(`Bot’s screwed, no botname set. Yell at your dev, dipshit.`));
    }

    if (!text) {
        return m.reply(formatStylishReply(`Oi, ${m.pushName}, you forgot the damn YouTube link, you moron! Example: .ytmp4 https://youtube.com/watch?v=whatever`));
    }

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
    if (!urls) {
        return m.reply(formatStylishReply(`That’s not a valid YouTube link, ${m.pushName}, you clueless twit!`));
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://api.giftedtech.web.id/api/download/ytvid?apikey=gifted_api_se5dccy&url=${encodedUrl}`;
        const response = await fetch(apiUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            throw new Error(`API puked with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.result || !data.result.download_url) {
            throw new Error(`API’s useless, ${data.msg || 'No video, you loser.'} Falling back...`);
        }

        const { title, download_url: videoUrl, type } = data.result;
        const mimeType = type === 'mp4' ? 'video/mp4' : 'video/mp4';
        const quality = data.result.format || '360p';

        // Validate video URL
        const headResponse = await fetch(videoUrl, {
            method: 'HEAD',
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });
        if (!headResponse.ok || !headResponse.headers.get('content-length') || parseInt(headResponse.headers.get('content-length')) > 50 * 1024 * 1024) {
            console.error(`Invalid or oversized video file at ${videoUrl}, size: ${headResponse.headers.get('content-length')}`);
            throw new Error(`API video file’s messed up, switching to backup plan.`);
        }

        await m.reply(`_Downloading ${title}_`);

        // Send video message
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

        // Send document message
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

        // Send caption
        await client.sendMessage(m.chat, { text: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ` }, { quoted: m });
    } catch (error) {
        console.error(`Error in ytmp4: ${error.message}`);

        // Fallback to ytdl-core
        if (error.message.includes('fallback') || error.message.includes('messed up') || error.message.includes('Couldn’t send')) {
            try {
                console.log(`Falling back to ytdl-core for ${text}`);
                const info = await ytdl.getInfo(text);
                const format = ytdl.chooseFormat(info.formats, { filter: 'videoandaudio', quality: 'highestvideo' });
                const videoUrl = format.url;
                const title = info.videoDetails.title;
                const mimeType = 'video/mp4';

                await m.reply(`_API flaked, grabbing ${title} with backup, chill!_`);

                // Send video message
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
                    console.error(`Fallback video send failed: ${videoError.message}`);
                    throw new Error(`Fallback video send failed, ${videoError.message}`);
                }

                // Send document message
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