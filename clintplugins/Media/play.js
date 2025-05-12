const { queue } = require('async');
const fetch = require('node-fetch');

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Audio error: ${error.message}`);
    }
    callback();
}, 1); // 1 at a time

// Rate limiting: track last execution time per user
const userLastUsed = new Map();
const RATE_LIMIT_MS = 30000; // 30 seconds cooldown per user

const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
};

module.exports = async (context) => {
    const { client, m, text, pushName } = context;

    // Rate limiting check
    const now = Date.now();
    const lastUsed = userLastUsed.get(m.sender) || 0;
    if (now - lastUsed < RATE_LIMIT_MS) {
        return m.reply(formatStylishReply(`Chill, ${pushName}! Wait ${Math.ceil((RATE_LIMIT_MS - (now - lastUsed)) / 1000)} seconds before trying again.`));
    }

    if (!text || text.trim() === '') {
        return m.reply(formatStylishReply(`Yo, ${pushName}, give me a YouTube URL! Example: .play https://www.youtube.com/watch?v=60ItHLz5WEA`));
    }

    // Validate YouTube URL
    const urlPattern = /(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!urlPattern.test(text.trim())) {
        return m.reply(formatStylishReply(`That’s not a valid YouTube URL, ${pushName}! Try something like https://www.youtube.com/watch?v=60ItHLz5WEA`));
    }

    try {
        await m.reply(formatStylishReply(`A moment, Toxic-MD is downloading your audio...`));

        // Download the audio
        const encodedUrl = encodeURIComponent(text.trim());
        const apiKey = 'gifted';
        const apiUrl = `https://api.giftedtech.web.id/api/download/dlmp3?apikey=${apiKey}&url=${encodedUrl}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Download server is down. Try again later.');
        }

        const data = await response.json();
        if (!data.success || !data.result?.download_url) {
            throw new Error('Couldn’t download the audio. Invalid URL or server issue.');
        }

        // Check duration if provided (max 5 minutes)
        if (data.result.duration) {
            const durationParts = data.result.duration.split(':').map(Number);
            const seconds = durationParts.length === 3
                ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
                : durationParts.length === 2
                    ? durationParts[0] * 60 + durationParts[1]
                    : durationParts[0];
            if (seconds > 300) {
                return m.reply(formatStylishReply(`Audio "${data.result.title}" is too long (${data.result.duration}), ${pushName}. Pick a shorter one (under 5 minutes)!`));
            }
        }

        const songTitle = data.result.title || 'Unknown Song';
        await client.sendMessage(m.chat, {
            audio: { url: data.result.download_url },
            mimetype: 'audio/mpeg',
            fileName: `${songTitle}.mp3`,
            ptt: false
        }, { quoted: m });

        const caption = formatStylishReply(`Here’s *${songTitle}*, ${pushName}! Jam on! 😎\n` +
                                         `🎵 *Source*: YouTube\n` +
                                         (data.result.duration ? `⏱️ *Duration*: ${data.result.duration}\n` : '') +
                                         (data.result.views ? `👀 *Views*: ${data.result.views}\n` : '') +
                                         `Powered by *Toxic-MD*`);

        await m.reply(caption);

        userLastUsed.set(m.sender, Date.now()); // Update last used time
    } catch (error) {
        console.error(`Audio command error: ${error.message}`);
        return m.reply(formatStylishReply(`Oops, ${pushName}! Couldn’t download the audio for "${text}". API’s down or the link’s busted. Try another URL.\nCheck https://github.com/xhclintohn/Toxic-MD for help.`));
    }
};