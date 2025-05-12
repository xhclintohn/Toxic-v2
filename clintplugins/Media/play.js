const { queue } = require('async');

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
    description: 'Searches and downloads audio from a YouTube song query',
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
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Yo, ${m.pushName}, give me a song to search! Example: .play Acapulco\n◈━━━━━━━━━━━━━━━━◈`);
        }

        try {
            // Sanitize query
            const cleanedQuery = text.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '');
            if (cleanedQuery.length < 3) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Come on, ${m.pushName}, at least 3 characters for the song query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ A moment, Toxic-MD is searching for "${cleanedQuery}"...\n◈━━━━━━━━━━━━━━━━◈`);

            // Search YouTube
            const encodedQuery = encodeURIComponent(cleanedQuery);
            const searchUrl = `https://api.giftedtech.web.id/api/search/yts?apikey=gifted&query=${encodedQuery}`;
            let searchData;
            try {
                searchData = await fetchJson(searchUrl, { timeout: 10000 });
                console.log(`Search API response for "${cleanedQuery}":`, JSON.stringify(searchData, null, 2));
            } catch (searchError) {
                console.error(`Search API error for "${cleanedQuery}": ${searchError.message}`);
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Sorry, ${m.pushName}! Search API failed for "${cleanedQuery}". It might be down or the query’s off. Try another song!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            if (!searchData || !searchData.success || !searchData.results || searchData.results.length === 0) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ No songs found for "${cleanedQuery}", ${m.pushName}. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Filter for videos only
            const videos = searchData.results.filter(item => item.type === 'video');
            if (videos.length === 0) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Found stuff, but no songs for "${cleanedQuery}", ${m.pushName}. Try a different query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Use the first video
            const selectedVideo = videos[0];

            // Check duration if provided (max 5 minutes)
            if (selectedVideo.duration) {
                const durationParts = selectedVideo.duration.split(':').map(Number);
                const seconds = durationParts.length === 3
                    ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
                    : durationParts.length === 2
                        ? durationParts[0] * 60 + durationParts[1]
                        : durationParts[0];
                if (seconds > 300) {
                    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Song "${selectedVideo.title}" is too long (${selectedVideo.duration}), ${m.pushName}. Pick a shorter one (under 5 minutes)!\n◈━━━━━━━━━━━━━━━━◈`);
                }
            }

            // Validate YouTube URL
            const urlPattern = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
            if (!urlPattern.test(selectedVideo.url)) {
                console.error(`Invalid YouTube URL from search: ${selectedVideo.url}`);
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! The song link for "${cleanedQuery}" is invalid. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Download the audio with retry
            const encodedUrl = encodeURIComponent(selectedVideo.url);
            const downloadUrl = `https://api.shizo.top/download/ytmp3?apikey=shizo&url=${encodedUrl}`;
            let downloadData;
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    downloadData = await fetchJson(downloadUrl, { timeout: 10000 });
                    console.log(`Download API response for "${selectedVideo.url}", attempt ${attempt}:`, JSON.stringify(downloadData, null, 2));
                    break;
                } catch (downloadError) {
                    console.error(`Download API error for "${selectedVideo.url}", attempt ${attempt}: ${downloadError.message}`);
                    if (attempt === 2) {
                        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${selectedVideo.title}", ${m.pushName}. Download API’s acting up. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
                    }
                }
            }

            if (!downloadData || !downloadData.status || !downloadData.result || !downloadData.result.download_url) {
                console.error(`Invalid download response for "${selectedVideo.url}":`, JSON.stringify(downloadData, null, 2));
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${selectedVideo.title}", ${m.pushName}. Invalid response from download API. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Send audio
            const caption = `◈━━━━━━━━━━━━━━━━◈\n❒ Here’s *${downloadData.result.title}*, ${m.pushName}! Jam out! 🎶\n` +
                           `🎵 *Source*: YouTube\n` +
                           (downloadData.result.quality ? `🔊 *Quality*: ${downloadData.result.quality}\n` : '') +
                           (downloadData.result.duration ? `⏱️ *Duration*: ${downloadData.result.duration}\n` : '') +
                           (downloadData.result.views ? `👀 *Views*: ${downloadData.result.views}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

            await client.sendMessage(m.chat, {
                audio: { url: downloadData.result.download_url },
                mimetype: 'audio/mpeg',
                caption: caption
            }, { quoted: m });

            userLastUsed.set(m.sender, Date.now()); // Update last used time
        } catch (error) {
            console.error(`Play command error for "${text}": ${error.message}\nStack: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! Couldn’t get the audio for "${text}". API’s down or something’s off. Try another query.\n❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};