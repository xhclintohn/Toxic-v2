const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed, no botname set. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you forgot the damn YouTube link, you moron! Example: .ytmp3 https://youtube.com/watch?v=whatever\n◈━━━━━━━━━━━━━━━━◈`);
    }

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi);
    if (!urls) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ That’s not a valid YouTube link, ${m.pushName}, you clueless twit!\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://api.shizo.top/download/ytmp3?apikey=shizo&url=${encodedUrl}`;
        const response = await fetch(apiUrl, { timeout: 10000 });
        if (!response.ok) {
            throw new Error(`API puked with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.status || !data.msg) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s useless, ${m.pushName}! ${data.msg || 'No audio, you loser.'} Try again, dumbass.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        await m.reply(`_Downloading audio..._`);
        await client.sendMessage(
            m.chat,
            {
                audio: { url: data.msg },
                mimetype: "audio/mpeg",
                fileName: `${m.pushName}_ytmp3.mp3`
            },
            { quoted: m }
        );

        await client.sendMessage(
            m.chat,
            {
                document: { url: data.msg },
                mimetype: "audio/mpeg",
                fileName: `${m.pushName}_ytmp3.mp3`
            },
            { quoted: m }
        );

 awaitsendMessage(m.chat, { text: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ` }, { quoted: m });
    } catch (error) {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! Couldn’t download your stupid audio. Try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};