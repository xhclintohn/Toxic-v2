const { queue } = require('async');

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Video error: ${error.message}`);
    }
    callback();
}, 1); // 1 at a time

// Rate limiting: track last execution time per user
const userLastUsed = new Map();
const RATE_LIMIT_MS = 30000; // 30 seconds cooldown per user

module.exports = {
    name: 'video',
    aliases: ['vid', 'youtube', 'yt'],
    description: 'Searches and downloads a random YouTube video',
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
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Yo, ${m.pushName}, give me a search query! Example: .video Spectre\n◈━━━━━━━━━━━━━━━━◈`);
        }

        try {
            // Sanitize query
            const cleanedQuery = text.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '');
            if (cleanedQuery.length < 3) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Come on, ${m.pushName}, at least 3 characters for the query! 🙄\n◈━━━━━━━━━━━━━━━━◈`);
            }

            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ A moment, Toxic-MD is searching for "${cleanedQuery}"...\n◈━━━━━━━━━━━━━━━━◈`);

            // Search YouTube
            const encodedQuery = encodeURIComponent(cleanedQuery);
            const searchData = await fetchJson(`https://api.giftedtech.web.id/api/search/yts?apikey=gifted&query=${encodedQuery}`);

            if (!searchData || !searchData.success || !searchData.results || searchData.results.length === 0) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ No videos found for "${cleanedQuery}", ${m.pushName}. Try a better query! 😒\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Filter for videos only
            const videos = searchData.results.filter(item => item.type === 'video');
            if (videos.length === 0) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Found stuff, but no videos for "${cleanedQuery}", ${m.pushName}. Pick a better query! 😒\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Randomly select from up to 5 videos
            const results = videos.slice(0, 5);
            const selectedVideo = results[Math.floor(Math.random() * results.length)];

            // Check duration (max 5 minutes)
            if (selectedVideo.duration) {
                const durationParts = selectedVideo.duration.split(':').map(Number);
                const seconds = durationParts.length === 3
                    ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
                    : durationParts.length === 2
                        ? durationParts[0] * 60 + durationParts[1]
                        : durationParts[0];
                if (seconds > 300) {
                    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Video "${selectedVideo.title}" is too long (${selectedVideo.duration}), ${m.pushName}. Pick a shorter one (under 5 minutes)! 😒\n◈━━━━━━━━━━━━━━━━◈`);
                }
            }

            // Download the video
            const downloadData = await fetchJson(`https://api.giftedtech.web.id/api/download/dlmp4?apikey=gifted&url=${encodeURIComponent(selectedVideo.url)}`);

            if (!downloadData || !downloadData.success || !downloadData.result || !downloadData.result.download_url) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${selectedVideo.title}", ${m.pushName}. API’s acting up. Try another query! 😒\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Build result message
            let resultMessage = `◈━━━━━━━━━━━━━━━━◈\n❒ Toxic-MD found ${results.length} videos for "${cleanedQuery}", ${m.pushName}! I picked one at random, you lucky one! 😈\n\n`;
            results.forEach((video, index) => {
                resultMessage += `${index + 1}. *${video.title}*${video.duration ? ` (${video.duration})` : ''}${video.url === selectedVideo.url ? ' [Picked]' : ''}\n`;
            });
            resultMessage += `\n◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

            await m.reply(resultMessage);

            // Send video
            const caption = `◈━━━━━━━━━━━━━━━━◈\n❒ Here’s *${downloadData.result.title}*, ${m.pushName}! Enjoy, don’t bore everyone! 😈\n` +
                           `📹 *Source*: YouTube\n` +
                           (selectedVideo.duration ? `⏱️ *Duration*: ${selectedVideo.duration}\n` : '') +
                           (downloadData.result.views ? `👀 *Views*: ${downloadData.result.views}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

            await client.sendMessage(m.chat, {
                video: { url: downloadData.result.download_url },
                caption: caption
            }, { quoted: m });

            userLastUsed.set(m.sender, Date.now()); // Update last used time
        } catch (error) {
            console.error(`Video command error: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! Couldn’t get your video for "${text}". API’s down or something’s off. Try later.\n❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};