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
    description: 'Downloads the YouTube video for "Alone"',
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

        // Check for "Alone" query (case-insensitive)
        const query = text ? text.trim().toLowerCase() : '';
        if (query !== 'alone') {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Yo, ${m.pushName}, this command only works for ".video Alone"! Try that instead.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        try {
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ A moment, Toxic-MD is downloading Alone...\n◈━━━━━━━━━━━━━━━━◈`);

            // Hardcoded YouTube URL for "Alone" (Alan Walker)
            const youtubeUrl = 'https://www.youtube.com/watch?v=1-xGerv5FOk';
            const encodedUrl = encodeURIComponent(youtubeUrl);

            // Download the video
            const downloadData = await fetchJson(`https://api.giftedtech.web.id/api/download/dlmp4?apikey=gifted&url=${encodedUrl}`);

            if (!downloadData || !downloadData.success || !downloadData.result || !downloadData.result.download_url) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download Alone, ${m.pushName}. API’s acting up. Try again later!\n◈━━━━━━━━━━━━━━━━◈`);
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
                    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Video "${downloadData.result.title}" is too long (${downloadData.result.duration}), ${m.pushName}. Can’t send it!\n◈━━━━━━━━━━━━━━━━◈`);
                }
            }

            // Send video
            const caption = `◈━━━━━━━━━━━━━━━━◈\n❒ Here’s *${downloadData.result.title}*, ${m.pushName}! Rock it! 😈\n` +
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
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Oops, ${m.pushName}! Couldn’t download Alone. API’s down or something’s off. Try later.\n❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};