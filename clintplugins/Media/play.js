const { queue } = require('async');
const yts = require('yt-search'); // Lightweight YouTube search

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Play queue error: ${error.message}`);
    }
    callback();
}, 1); // 1 at a time

// Rate limiting: track last execution time per user
const userLastUsed = new Map();
const RATE_LIMIT_MS = 30000; // 30 seconds cooldown per user

module.exports = {
    name: 'play',
    aliases: ['audio', 'mp3', 'ytaudio'],
    description: 'Downloads audio from a YouTube song query',
    run: async (context) => {
        const { client, m, text, botname, fetchJson } = context;

        if (!botname) {
            console.error('Botname not set.');
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Toxic-MD’s down! No botname set. Contact the dev.\n◈━━━━━━━━━━━━━━━━◈');
        }

        // Rate limiting check
        const now = Date.now();
        const lastUsed = userLastUsed.get(m.sender) || 0;
        if (now - lastUsed < RATE_LIMIT_MS) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Chill, ${m.pushName}! Wait ${Math.ceil((RATE_LIMIT_MS - (now - lastUsed)) / 1000)} seconds before trying again.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        if (!text || text.trim() === '') {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Yo, ${m.pushName}, give me a song to search! Example: .play Alone ft Ava Max\n◈━━━━━━━━━━━━━━━━◈');
        }

        try {
            // Sanitize query
            const cleanedQuery = text.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '');
            if (cleanedQuery.length < 3) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Come on, ${m.pushName}, at least 3 characters for the song query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ A moment, Toxic-MD is searching for "${cleanedQuery}"...\n◈━━━━━━━━━━━━━━━━◈`);

            // Search YouTube using yt-search
            const searchResults = await yts(cleanedQuery);
            const video = searchResults.videos[0];
            if (!video) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ No songs found for "${cleanedQuery}", ${m.pushName}. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Normalize YouTube URL to short format (youtu.be)
            const videoId = video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1];
            const normalizedUrl = videoId ? `https://youtu.be/${videoId}` : video.url;

            // Download the audio
            const encodedUrl = encodeURIComponent(normalizedUrl);
            const downloadUrl = `https://api.shizo.top/download/ytmp3?apikey=shizo&url=${encodedUrl}`;
            let downloadData;
            try {
                console.log(`Calling API: ${downloadUrl}`);
                downloadData = await fetchJson(downloadUrl, { timeout: 15000 });
                console.log(`Download API response for "${normalizedUrl}":`, JSON.stringify(downloadData, null, 2));
            } catch (downloadError) {
                console.error(`Download API error for "${normalizedUrl}": ${downloadError.message}, URL: ${downloadUrl}`);
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${video.title}", ${m.pushName}. The download API’s acting up or the song’s unavailable. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            if (!downloadData) {
                console.error(`No download response for "${normalizedUrl}":`, JSON.stringify(downloadData, null, 2));
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${video.title}", ${m.pushName}. Got nothing from the API. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Send audio with whatever URL the API provides
            const audioUrl = downloadData.result?.download_url || downloadData.download_url || downloadData.url;
            if (!audioUrl) {
                console.error(`No audio URL in response for "${normalizedUrl}":`, JSON.stringify(downloadData, null, 2));
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${video.title}", ${m.pushName}. No audio link from the API. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            const title = downloadData.result?.title || video.title || cleanedQuery;
            const quality = downloadData.result?.quality || '';

            const caption = `◈━━━━━━━━━━━━━━━━◈\n❒ Here’s *${title}*, ${m.pushName}! Jam out! 🎶\n` +
                           `🎵 *Source*: YouTube\n` +
                           (quality ? `🔊 *Quality*: ${quality}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

            await client.sendMessage(m.chat, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                caption: caption
            }, { quoted: m });

            userLastUsed.set(m.sender, Date.now()); // Update last used time
        } catch (error) {
            console.error(`Play command error for "${text}": ${error.message}\nStack: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! Couldn’t get the audio for "${text}". Something’s off with the API or search. Try another query.\n❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};