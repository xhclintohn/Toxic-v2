const { queue } = require('async');

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Play error: ${error.message}`);
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
            return m.reply('◈━━━━━━━━━━━━━━━━◈\n❒ Bot’s down! No botname set. Contact the dev.\n◈━━━━━━━━━━━━━━━━◈');
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
            const searchData = await fetchJson(`https://api.giftedtech.web.id/api/search/yts?apikey=gifted&query=${encodedQuery}`);

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

            // Download the audio
            const encodedUrl = encodeURIComponent(selectedVideo.url);
            const downloadData = await fetchJson(`https://api.shizo.top/download/ytmp3?apikey=shizo&url=${encodedUrl}`);

            if (!downloadData || !downloadData.status || !downloadData.result || !downloadData.result.download_url) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${selectedVideo.title}", ${m.pushName}. API’s acting up or link’s busted. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
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
            console.error(`Play command error: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! Couldn’t get the audio for "${text}". API’s down or something’s off. Try another query.\n❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};