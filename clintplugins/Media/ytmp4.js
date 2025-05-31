const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed, no botname set. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you forgot the damn YouTube link, you moron! Example: .ytvid https://youtube.com/watch?v=whatever\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
    if (!urls) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ That’s not a valid YouTube link, ${m.pushName}, you clueless twit!\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://api.giftedtech.web.id/api/download/ytvid?apikey=gifted_api_se5dccy&format=360p&url=${encodedUrl}`;
        const response = await fetch(apiUrl, { timeout: 10000 });
        if (!response.ok) {
            throw new Error(`API puked with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.result || !data.result.download_url) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s useless, ${m.pushName}! ${data.msg || 'No video, you loser.'} Try again, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const { title, download_url: videoUrl } = data.result;

        await m.reply(`_Downloading ${title}_`);
        await client.sendMessage(
            m.chat,
            {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                fileName: `${title}.mp4`
            },
            { quoted: m }
        );

        await client.sendMessage(
            m.chat,
            {
                document: { url: videoUrl },
                mimetype: "video/mp4",
                fileName: `${title}.mp4`
            doub},
            { quoted: m }
        );

        await client.sendMessage(m.chat, { text: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ` }, { quoted: m });
    } catch (error) {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! Couldn’t download your stupid video. Try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};