const { queue } = require('async');
const yts = require('yt-search');

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
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Yo, ${m.pushName}, give me a song to search! Example: .play Alone ft Ava Max\n◈━━━━━━━━━━━━━━━━◈`);
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

            // Download the audio with retry
            const encodedUrl = encodeURIComponent(video.url);
            const downloadUrl = `https://api.shizo.top/download/ytmp3?apikey=shizo&url=${encodedUrl}`;
            let downloadData;
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    downloadData = await fetchJson(downloadUrl, { timeout: 10000 });
                    console.log(`Download API response for "${video.url}", attempt ${attempt}:`, JSON.stringify(downloadData, null, 2));
                    break;
                } catch (downloadError) {
                    console.error(`Download API error for "${video.url}", attempt ${attempt}: ${downloadError.message}`);
                    if (attempt === 2) {
                        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${video.title}", ${m.pushName}. Download API’s acting up. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
                    }
                }
            }

            if (!downloadData || !downloadData.success || !downloadData.result || !downloadData.result.download_url) {
                console.error(`Invalid download response for "${video.url}":`, JSON.stringify(downloadData, null, 2));
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${video.title}", ${m.pushName}. Invalid response from download API. Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Send audio
            const caption = `◈━━━━━━━━━━━━━━━━◈\n❒ Here’s *${downloadData.result.title}*, ${m.pushName}! Jam out! 🎶\n` +
                           `🎵 *Source*: YouTube\n` +
                           (downloadData.result.quality ? `🔊 *Quality*: ${downloadData.result.quality}\n` : '') +
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