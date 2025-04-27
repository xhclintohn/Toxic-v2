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
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you forgot the song name, you dumb fuck! Example: .lyrics Faded\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedText = encodeURIComponent(text);
        const apiUrl = `https://api.giftedtech.web.id/api/search/lyrics?apikey=gifted&query=${encodedText}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.success || !data.result) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No lyrics found for "${text}", you tone-deaf loser. Try a real song, ${m.pushName}.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        // Assuming result is a string of lyrics; adjust if API returns an object
        const lyrics = data.result;
        const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Song Lyrics, You Basic Bitch*\n\n` +
                       `📜 *Title*: ${text}\n` +
                       `🎤 *Artist*: Unknown (API’s too shitty to tell)\n\n` +
                       `${lyrics}\n\n` +
                       `│❒ Powered by *${botname}*, ‘cause ${m.pushName}’s too dumb to Google lyrics\n◈━━━━━━━━━━━━━━━━◈`;

        await client.sendMessage(m.chat, {
            image: { url: pict },
            caption: caption
        }, { quoted: m });
    } catch (error) {
        console.error(`Lyrics API fucked up: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}. Couldn’t get lyrics for "${text}". API’s trash or you’re cursed. Try later.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};