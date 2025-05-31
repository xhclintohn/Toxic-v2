const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s screwed, no botname set. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Oi, ${m.pushName}, you forgot the damn prompt! Try: .imagine a badass dragon burning shit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const encodedText = encodeURIComponent(text);
        const apiUrl = `https://api.shizo.top/ai/imagine?apikey=shizo&prompt=${encodedText}`;
        const response = await fetch(apiUrl, { timeout: 10000 });
        if (!response.ok) {
            throw new Error(`API puked with status ${response.status}`);
        }

        const data = await response.json();
        if (!data.status || !data.msg) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s useless, ${m.pushName}! No image, try again, loser.\n◈━━━━━━━━━━━━━━━━◈`);
        }

        await client.sendMessage(
            m.chat,
            {
                image: { url: data.msg },
                caption: `> ρσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`
            },
            { quoted: m }
        );
    } catch (error) {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! Couldn’t generate your stupid image. Try later, you whiny prick.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};