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
            return m) {
            return m.reply(`◈━━━━━━━━━━━━━━━━.reply(`◈━━━━━━━━━━━━━━━━◈\◈\n❒n❒ Chill, ${m.push Chill, ${m.pushName}!Name}! Wait ${ Wait ${Math.ceil((RATE_LIMITMath.ceil((RATE_LIMIT_MS - (now - last_MS - (now - lastUsed)) /Used)) / 1000)} 1000)} seconds before trying again.\n seconds before trying again.\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━━━━━━━━━◈`);
◈`);
        }

        if        }

        if (!text || (!text || text.trim() === '') {
 text.trim() === '')            return m.reply(` {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈━━━━━━━━━━━━━━━━◈\◈\n❒n❒ Yo Yo, ${m.push, ${m.pushName}, giveName}, give me a song to search me a song to search! Example! Example: .play Acapulco\n◈━━━━━━━━━━━━━━━━: .play Acapulco\n◈━━━━━━━━━━━━━━━━◈`);
◈`);
        }

        try        }

        try {
            // Sanitize query
            const cleanedQuery {
            // Sanitize query
            const cleanedQuery = text.trim().slice = text.trim(0, 50).().slice(0, 50).replace(/[^replace(/[^a-zA-Z0a-zA-Z0-9\s-9\s]/g]/g, '');
            if (, '');
            if (cleanedQuerycleanedQuery.length <.length < 3) {
                return m 3) {
                return m.reply(`◈━━━━━━━━.reply(`◈━━━━━━━━━━━━━━━━━━━━━━━━◈\◈\n❒n❒ Come Come on, ${m.push on, ${m.pushName}, atName}, at least 3 characters for the least 3 characters for the song query!\n song query!\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━◈━━━━━━━━◈`);
            }

           `);
            }

            await m.reply(` await m.reply(`◈━━━━━━━━◈━━━━━━━━━━━━━━━━━━━━━━━━◈\◈\n❒ An❒ A moment, Toxic-MD moment, Toxic-MD is searching for "${ is searching for "${cleanedQuery}"...\cleanedQuery}"...\nn◈━━━━━━━━◈━━━━━━━━━━━━━━━━━━━━━━━━◈`);

◈`);

            // Search You            // Search YouTube
Tube
            const encoded            const encodedQuery = encodeURIComponent(cleanQuery = encodeURIComponent(cleanedQuery);
            const searchData = await fetchJson(`edQuery);
            const searchData = await fetchJson(`https://apihttps://api.g.giftedtech.webiftedtech.web.id.id/api/search/api/search/y/ytsts?apikey=g?apikey=gifted&queryifted&query=${encodedQuery}`);

=${encodedQuery}`);

            if (!searchData ||            if (!searchData || !search !searchData.success || !searchData.results || searchData.results.length === 0) {
               Data.success || !searchData return m.reply(`◈━━━━━━━━.results || searchData.results.length === 0)━━━━━━━━◈\ {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ No songsn❒ No songs found for "${clean found for "${cleanedQuery}", ${m.pushedQuery}", ${m.pushName}. Try anotherName}. Try another query!\n query!\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━◈━━━━━━━━◈`);
`);
            }

            // Filter for            }

            // Filter for videos only
            const videos videos only
            const videos = searchData.results.filter(item => item.type === 'video = searchData.results.filter(item => item.type === 'video');
            if (videos.length === 0) {
');
            if (videos.length === 0) {
                return m.reply(`                return m.reply(`◈━━━━━━━━━━━━━━━━◈━━━━━━━━━━━━━━━━◈\◈\n❒n❒ Found stuff Found stuff, but no songs, but no songs for "${clean for "${cleanedQuery}", ${edQuery}", ${m.pushName}. Trym.pushName}. Try a different query!\n◈━━━━━━━━ a different query!\n◈━━━━━━━━━━━━━━━━◈`);
━━━━━━━━◈`);
            }
            }

            // Use the
            // Use the first video
            const selectedVideo = videos[0];

 first video
            const selectedVideo = videos[0];

            // Check duration if            // Check duration if provided (max 5 provided (max 5 minutes)
            if minutes)
            if (selectedVideo.duration) {
 (selectedVideo.duration) {
                const durationParts = selectedVideo                const durationParts = selectedVideo.duration.split(':').map.duration.split(':').map(Number);
                const seconds(Number);
                const seconds = durationParts.length === 3 = durationParts.length === 3
                    ? duration
                    ? durationParts[0] *Parts[0 3600 + durationParts[1] * 60 + durationParts] * 3600 + durationParts[1] * 60 + durationParts[2]
                    : durationParts.length[2]
                    : durationParts.length === === 2
                        ? durationParts[0] * 60 + duration 2
                        ? durationParts[0] * 60 + durationParts[1Parts[1]
                        : durationParts[0];
               ]
                        : durationParts[0];
                if (seconds > 300) {
 if (seconds > 300) {
                    return m.reply                    return m.reply(`◈━━━━━━━━━━━━━━━━(`◈━━━━━━━━━━━━━━━━◈\n◈\n❒ Song❒ Song "${selectedVideo.title}" is too long (${selectedVideo.duration}), ${ "${selectedVideo.title}" is too long (${selectedVideo.duration}), ${m.pushNamem.pushName}. Pick a shorter one (under 5 minutes)!\n}. Pick a shorter one (under 5 minutes)!\n◈━━━━━━━━━━━━━━━━◈━━━━━━━━━━━━━━━━◈`);
◈`);
                }
            }

            //                }
            }

            // Download the audio
            const encoded Download the audio
            const encodedUrl = encodeURIComponent(selectedVideoUrl = encodeURIComponent(selectedVideo.url);
            const.url);
            const downloadData = await fetchJson(`https://api.shizo.top/download downloadData = await fetchJson(`https://api.shizo.top/download/ytmp3?apikey=shizo&url=${encodedUrl/ytmp3?apikey=shizo&url=${encodedUrl}`);
}`);

            if (!downloadData ||
            if (!downloadData || !downloadData !downloadData.status || !downloadData.result || !downloadData.result.download_url.status || !downloadData.result || !downloadData.result.download_url) {
                return m) {
                return m.reply(`.reply(`◈━━━━━━━━━━━━━━━━◈━━━━━━━━━━━━━━━━◈\n❒ Couldn’t download "${◈\n❒ Couldn’t download "${selectedVideo.title}", ${m.pushNameselectedVideo.title}",}. API’s acting up or link ${m.pushName}. API’s acting up or link’s busted.’s busted. Try another query!\n Try another query!\n◈━━━━━━━━━━━━━━━━◈`);
            }

            // Send audio◈━━━━━━━━━━━━━━━━◈`);
            }

            // Send audio
            const caption = `
            const caption = `◈━━━━━━━━◈━━━━━━━━━━━━━━━━━━━━━━━━◈\◈\n❒ Here’s *${downloadn❒ Here’s *${downloadData.result.title}*, ${m.pushName}! JamData.result.title}*, ${m.pushName}! Jam out! 🎶\n out! 🎶\n`` +
                           `🎵 *Source*: YouTube\n` + +
                           `🎵 *Source*: YouTube\n` +
                          
                           (downloadData.result.quality (downloadData.result.quality ? `🔊 ? `🔊 *Quality *Quality*: ${downloadData.result.quality}\n`*: ${downloadData.result.quality}\n` : '') +
                           (download : '') +
                           (downloadData.result.durationData.result.duration ? ? ` `⏱⏱️ *️ *DurationDuration*: ${downloadData.result.duration}\n*: ${downloadData.result.duration}\n` : '') +
                           (downloadData.result.views` : '') ? `👀 *Views*: ${downloadData.result +
                           (downloadData.result.views ? `👀 *Views*: ${downloadData.result.views}\n` : '') +
                           `◈━━━━━━━━.views}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━◈\━━━━━━━━◈\nPowered by *nPowered by *${botname${botname}*`;

            await}*`;

 client.sendMessage(m.chat,            await client {
                audio.sendMessage(m.chat: { url: downloadData.result.download_url },
                mimetype, {
                audio: { url: downloadData.result.download_url },
                mimetype: 'audio: 'audio/mpeg',
                caption: caption
            }, { quoted: m });

            user/mpeg',
                caption: caption
            }, { quoted: m });

            userLastUsed.setLastUsed.set(m.sender, Date.now()); // Update last used time
        } catch (error(m.sender, Date.now()); // Update last used time
        } catch (error) {
            console.error(`Play command error: ${error) {
            console.error(`Play command error.stack}`);
: ${error.stack}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━            await m.reply(`◈━━━━━━━━━━━━━━━━◈\◈\n❒n❒ Oops, ${m.pushName}! Couldn’t get Oops, ${m.pushName}! Couldn’t get the audio for "${text}". API’s down or something’s off. Try the audio for "${text}". API’s down or something’s off. Try another query.\n another query.\n❒ Check https://github.com/xhcl❒ Check https://github.com/xhclintohn/Toxic-MD forintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};
 help.\n◈━━━━━━━━━━━━━━━━◈`);
        }
    }
};