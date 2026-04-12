const fetch = require('node-fetch');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
    const { client, m } = context;
    const fq = getFakeQuoted(m);

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const res = await fetch('https://nekobot.xyz/api/image?type=ass');
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        const data = await res.json();

        if (!data.success || !data.message) throw new Error('No image URL returned');

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            image: { url: data.message },
            caption: `╭───(    TOXIC-MD    )───\n├───≫ NSFW ≪───\n├ \n├ Type: ass\n├ Here you go, you degenerate.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });

    } catch (error) {
        console.error('NSFW error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to fetch NSFW content.\n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
