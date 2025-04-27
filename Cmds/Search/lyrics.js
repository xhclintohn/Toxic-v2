const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, pict, botname } = context;

    if (!botname) {
        console.error(`Botname not set, you useless fuck.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!pict) {
        console.error(`Pict not set, you brain-dead moron.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No image to send, you idiot. Fix your shitty context.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you forgot the damn song, you tone-deaf fuck! Example: .lyrics Spectre\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedText = encodeURIComponent(text);
        const apiUrl = `https://api.giftedtech.web.id/api/search/lyricsv2?apikey=gifted&query=${encodedText}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success || !data.result) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No lyrics for "${text}", you musically illiterate loser. Try a real song, ${m.pushName}.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        const lyrics = data.result.replace(/:\n/g, '').trim(); // Clean up weird formatting
        const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Lyrics for You, You Basic Bitch*\n\n` +
                       `📜 *Title*: ${text}\n` +
                       `🎤 *Artist*: Unknown (API’s too dumb to say)\n\n` +
                       `${lyrics}\n\n` +
                       `│❒ Powered by *${botname}*, ‘cause ${m.pushName}’s too stupid to find lyrics\n◈━━━━━━━━━━━━━━━━◈`;

        await client.sendMessage(m.chat, {
            image: { url: pict },
            caption: caption
        }, { quoted: m });
    } catch (error) {
        console.error(`Lyrics API fucked up: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}. Couldn’t get lyrics for "${text}". API’s garbage or you’re jinxed. Try later.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};