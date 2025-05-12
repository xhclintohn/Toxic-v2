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
    description: 'Downloads a YouTube video from a provided URL',
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
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Yo, ${m.pushName}, give me a YouTube URL! Example: .video https://www.youtube.com/watch?v=60ItHLz5WEA\n◈━━━━━━━━━━━━━━━━◈`);
        }

        // Validate YouTube URL
        const urlPattern = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        if (!urlPattern.test(text.trim())) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ That’s not a valid YouTube URL, ${m.pushName}! Try something like https://www.youtube.com/watch?v=60ItHLz5WEA\n◈━━━━━━━━━━━━━━━━◈`);
        }

        try {
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ A moment, Toxic-MD is downloading your video...\n◈━━━━━━━━━━━━━━━━◈`);

            // Download the video
            const encodedUrl = encodeURIComponent(text.trim());
            const downloadData = await fetchJson(`https://api.giftedtech.web.id/api/download/dlmp4?apikey=gifted&url=${encodedUrl}`);

            if (!downloadData || !downloadData.success || !downloadData.result || !downloadData.result.download_url) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download the video, ${m.pushName}. Invalid URL or API’s acting up. Check the link and try again!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Check duration if provided (max 5 minutes)
            if (downloadData.result.duration) {
                const durationParts = downloadData.result.duration.split(':').map(Number);
                const seconds = durationParts.length === 3
                    ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
                    : durationParts.length === 2
                        ? durationParts[0] * 60 + durationParts[1]
                        : durationParts[0];
                if (seconds > 300) {
                    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Video "${downloadData.result.title}" is too long (${downloadData.result.duration}), ${m.pushName}. Pick a shorter one (under 5 minutes)!\n◈━━━━━━━━━━━━━━━━◈`);
                }
            }

            // Send video
            const caption = `◈━━━━━━━━━━━━━━━━◈\n❒ Here’s *${downloadData.result.title}*, ${m.pushName}! Enjoy the vibes! 😈\n` +
                           `📹 *Source*: YouTube\n` +
                           (downloadData.result.quality ? `🎥 *Quality*: ${downloadData.result.quality}\n` : '') +
                           (downloadData.result.duration ? `⏱️ *Duration*: ${downloadData.result.duration}\n` : '') +
                           (downloadData.result.views ? `👀 *Views*: ${downloadData.result.views}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

            await client.sendMessage(m.chat, {
                video: { url: downloadData.result.download_url },
                caption: caption
            }, { quoted: m });

            userLastUsed.set(m.sender, Date.now()); // Update last used time
        } catch (error) {
            console.error(`Video command error: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! Couldn’t download the video for "${text}". API’s down or the link’s busted. Try another URL.\n❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};