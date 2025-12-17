const acrcloud = require("acrcloud");
const yts = require("yt-search");
const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, mime } = context;

    try {
        const acr = new acrcloud({
            host: 'identify-ap-southeast-1.acrcloud.com',
            access_key: '26afd4eec96b0f5e5ab16a7e6e05ab37',
            access_secret: 'wXOZIqdMNZmaHJP1YDWVyeQLg579uK2CfY6hWMN8'
        });

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
        const statusMsg = await m.reply("Analyzing audio... Your taste is about to be judged.");

        if (!m.quoted) return m.reply("Quote an audio/video message, you deaf imbecile.");
        
        const p = m.quoted ? m.quoted : m;
        const buffer = await p.download();

        const { status, metadata } = await acr.identify(buffer);
        if (status.code !== 0) {
            await client.sendMessage(m.chat, { delete: statusMsg.key });
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("Song not recognized. Your audio is as indecipherable as your life choices.");
        }

        const { title, artists, album, genres, release_date } = metadata.music[0];
        let txt = `*🎵 SONG IDENTIFIED*\n\n`;
        txt += `*Title:* ${title}\n`;
        if (artists) txt += `*Artists:* ${artists.map(v => v.name).join(', ')}\n`;
        if (album) txt += `*Album:* ${album.name}\n`;
        if (genres) txt += `*Genres:* ${genres.map(v => v.name).join(', ')}\n`;
        if (release_date) txt += `*Release:* ${release_date}\n`;

        await client.sendMessage(m.chat, { delete: statusMsg.key });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(txt + `\n—\nTσxιƈ-ɱԃȥ`);

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
        const searchMsg = await m.reply(`Searching YouTube for "${title}"...`);

        const searchQuery = `${title} ${artists ? artists.map(v => v.name).join(' ') : ''}`;
        const searchResult = await yts(searchQuery);
        const video = searchResult.videos[0];

        if (!video) {
            await client.sendMessage(m.chat, { delete: searchMsg.key });
            await m.reply(`Couldn't find "${title}" on YouTube. Your song is too obscure even for the internet.`);
            return;
        }

        const response = await fetch(`https://api.ootaizumi.web.id/downloader/youtube?url=${encodeURIComponent(video.url)}&format=720`);
        const data = await response.json();

        if (!data.status || !data.result?.download) {
            await client.sendMessage(m.chat, { delete: searchMsg.key });
            throw new Error('API failed to download audio.');
        }

        const audioUrl = data.result.download;

        await client.sendMessage(m.chat, { delete: searchMsg.key });
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
            caption: `🥀 ${title}\n—\nTσxιƈ-ɱԃȥ`
        }, { quoted: m });

    } catch (error) {
        console.error('Music recognition error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`Music recognition failed. Your audio is probably garbage.\nError: ${error.message}`);
    }
};