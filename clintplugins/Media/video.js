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
    description: 'Downloads a 'Downloads a 'Downloads a YouTube video from YouTube video from a provided a provided YouTube video from a provided URL',
    run URL',
    run URL',
    run: async (context) =>: async (context) =>: async (context) => { { {

       
        const {        const { const { client, m, text client, m, text client, m, text, bot, bot, botname, fetchJsonname, fetchJsonname, fetchJson } = context } = context } = context;
;

        if;

        if
        if (!bot (!bot (!botname) {
            consolename) {
            consolename) {
            console.error('Bot.error('Bot.error('Botname not set.');
            returnname not set.');
            returnname not set.');
            return m.reply('◈━━━━━━━━ m.reply('◈━━━━━━━━ m.reply('◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈\◈\◈\n❒n❒n❒ Bot’s Bot’s Bot’s down! No bot down! No botname set. Contactname set. Contact the dev.\n the dev.\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━━━━━━━━━◈');
◈');
        }

        // Rate        }

        // Rate limiting check
        const limiting check
        const now = Date.now();
        now = Date.now();
        const lastUsed = userLast const lastUsed = userLastUsed.get(m.senderUsed.get(m.sender) || 0;
       ) || 0;
        if (now if (now - lastUsed < RATE_LIMIT - lastUsed < RATE_LIMIT_MS) {
            return m_MS) {
            return m.reply(`◈━━━━━━━━.reply(`◈━━━━━━━━━━━━━━━━◈\━━━━━━━━◈\n❒ Chill, ${mn❒ Chill, ${m.pushName}! Wait ${Math.ceil((RATE_LIMIT_MS.pushName}! Wait ${Math.ceil(( - (now - lastUsed)) / 1000)} secondsRATE_LIMIT_MS before trying again - (now - lastUsed)) / 1000)} seconds before trying again.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        if (!text || text.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        if (!text || text.trim() === '') {
            return m.reply(`.trim() === '') {
            return m.reply(`◈━━━━━━━━◈━━━━━━━━━━━━━━━━◈\━━━━━━━━◈\n❒n❒ Yo Yo, ${m.push, ${m.pushName}, giveName}, give me a YouTube URL! me a YouTube URL! Example: . Example: .video https://www.youtube.comvideo https://www.youtube.com/watch?v=60/watch?v=60ItHLzItHLz5WEA\n5WEA\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━◈━━━━━━━━◈`);
`);
        }

        // Validate        }

        // Validate YouTube URL
        const YouTube URL
        const urlPattern = /( urlPattern = /(https?:\/\/)?(https?:\/\/)?(www\www\.)?(youtube.)?(youtube\.com|youtu\.com|youtu\.\.be)be)\/.\/.+/;
        if (!url+/;
        if (!urlPattern.test(textPattern.test(text.trim())) {
            return m.trim())) {
            return m.reply(`◈━━━━━━━━━━━━━━━━.reply(`◈━━━━━━━━━━━━━━━━◈◈\n\n❒ That’s❒ That’s not a valid not a valid YouTube URL YouTube URL, ${m.pushName}! Try, ${m.pushName}! Try something like https://www.youtube something like https://www.youtube.com/watch.com/watch?v=60?v=60ItHLz5WEAItHLz5WEA\n\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━◈━━━━━━━━◈`);
`);
        }

        try        }

        try {
            await m.reply(` {
            await m.reply(`◈━━━━━━━━━━━━━━━━◈━━━━━━━━━━━━━━━━◈\◈\nn❒ A❒ A moment, Toxic moment, Toxic-MD is downloading-MD is downloading your your video...\n video...\n◈━━━━━━━━◈━━━━━━━━━━━━━━━━━━━━━━━━◈`);

◈`);

            // Download            // Download the video
            the video
            const encoded const encodedUrl = encodeUrl = encodeURIComponent(text.trim());
URIComponent(text.trim());
            const downloadData = await            const downloadData = await fetchJson(`https://api fetchJson(`https://api.giftedtech.giftedtech.web.id.web.id/api/download/api/download/dlmp4?apikey=g/dlmp4?apikey=gifted&url=${ifted&url=${encodedUrl}`);

encodedUrl}`);

            if (!            if (!downloadData ||downloadData || !download !downloadData.success || !downloadDataData.success || !downloadData.result || !downloadData.result.result || !downloadData.result.download_url).download_url) {
                return m.reply(` {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈◈━━━━━━━━━━━━━━━━◈\n❒ Could\n❒ Couldn’t download the video,n’t download the video, ${m.push ${m.pushName}. InvalidName}. Invalid URL or API URL or API’s acting up.’s acting up. Check the Check the link link and try again!\n and try again!\n◈━━━━━━━━━━━━━━━━◈`);
◈━━━━━━━━━━━━━━━━◈`);
            }

            // Check duration if provided (max            }

            // Check duration if provided (max 5 minutes 5 minutes)
            if)
            if (downloadData.result.duration) {
 (downloadData.result.duration) {
                const durationParts                const durationParts = downloadData.result.duration.split(':').map(Number);
                const seconds = downloadData.result.duration.split(':').map(Number);
                const seconds = durationParts = durationParts.length === 3.length === 3
                    ?
                    ? durationParts[0] * durationParts[0] * 3600 + durationParts[1] * 60 3600 + durationParts[1] * 60 + durationParts + durationParts[2]
                    : durationParts.length ===[2]
                    : durationParts.length === 2
                        ? durationParts[0] 2
                        ? durationParts[0] * 60 + durationParts * 60 + durationParts[1]
                        : durationParts[0];
               [1]
                        : if durationParts[ (seconds > 3000];
) {
                    return m.reply(`◈                if (seconds > 300━━━━━━━━) {
━━━━━━━━◈\n                    return m.reply(`◈❒ Video "${━━━━━━━━━━━━━━━━◈downloadData.result.title}" is too\n❒ long (${download Video "${downloadData.result.duration}), ${m.pushData.result.title}" is tooName}. Pick long (${download a shorter oneData.result.duration}), ${m.pushName}. Pick a shorter one (under 5 minutes)!\n (under 5◈━━━━━━━━━━━━━━━━ minutes)!\n◈━━━━━━━━━━━━━━━━◈◈`);
`);
                }
            }

            // Send video                }
            }

            // Send video
            const caption
            const caption = ` = `◈━━━━━━━━━━━━━━━━◈━━━━━━━━━━━━━━━━◈\◈\nn❒ Here❒ Here’s’s *${download *${downloadData.result.title}*, ${m.pushName}! EnjoyData.result.title}*, ${m.pushName}! Enjoy the vibes the vibes! 😈! 😈\n` +
                          \n` +
                           `📹 *Source `📹 *Source*: YouTube*: YouTube\n\n` +
                           (` +
                           (downloadData.result.quality ? `downloadData.result.quality ? `🎥 *Quality🎥 *Quality*: ${downloadData.result.quality*: ${downloadData.result.quality}\n`}\n` : '') + : '') +
                           (downloadData.result.duration ? `
                           (downloadData.result.duration ? `⏱️ *⏱️ *Duration*: ${downloadDuration*: ${downloadData.result.duration}\n` :Data.result.duration}\n` : '') +
                           ( '') +
downloadData.result.views ? `👀 *                           (downloadData.result.views ? `👀 *Views*: ${Views*: ${downloadData.result.views}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━downloadData.result.views}\n` : '') +
                           `◈━━━━━━━━━━━━━━━━◈\n◈\nPowered by *${botPowered by *${botnamename}*`;

            await client.sendMessage(m.chat, {
                video: { url: download}*`;

            await client.sendMessageData.result.download_url(m.chat, {
                video: { url: downloadData.result.download_url },
                caption },
                caption: caption
            },: caption
            }, { quoted: { quoted: m });
 m });

            userLastUsed.set(m.sender, Date
           .now()); // Update last used time
 userLastUsed.set(m        } catch (error) {
.sender, Date            console.error.now()); // Update last used time
        } catch (error) {
            console.error(`Video command error: ${error.stack}`);
            await m(`Video command error: ${error.stack.reply(`◈━━━━━━━━━━━━━━━━}`);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒◈\n Oops, ${m.pushName}! Could❒ Oops, ${m.pushName}! Couldn’t downloadn’t download the video for "${text}". API the video for "${text}". API’s down or the link’s busted. Try’s down or the link’s busted. Try another URL.\ another URL.\n❒ Check https://github.com/xhn❒ Check https://github.com/xhclintohn/Toxic-MD for helpclintohn/Toxic-MD for help.\n◈━━━━━━━━.\n◈━━━━━━━━━━━━━━━━◈`);━━━━━━━━◈`);

        }
        }
    }
};