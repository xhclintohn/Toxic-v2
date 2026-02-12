const acrcloud = require("acrcloud");

module.exports = async (context) => {
    const { client, m } = context;

    try {
        const acr = new acrcloud({
            host: 'identify-ap-southeast-1.acrcloud.com',
            access_key: '26afd4eec96b0f5e5ab16a7e6e05ab37',
            access_secret: 'wXOZIqdMNZmaHJP1YDWVyeQLg579uK2CfY6hWMN8'
        });

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        if (!m.quoted) return m.reply("╭───(    TOXIC-MD    )───\n├ Quote an audio/video message, you deaf imbecile.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

        const p = m.quoted ? m.quoted : m;
        const buffer = await p.download();

        const { status, metadata } = await acr.identify(buffer);
        if (status.code !== 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("╭───(    TOXIC-MD    )───\n├ Song not recognized.\n├ Your audio is as indecipherable as your life choices.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const { title, artists, album, genres, release_date } = metadata.music[0];
        let txt = `╭───(    TOXIC-MD    )───\n├───≫ SHAZAM ≪───\n├ \n`;
        txt += `├ Title: ${title}\n`;
        if (artists) txt += `├ Artists: ${artists.map(v => v.name).join(', ')}\n`;
        if (album) txt += `├ Album: ${album.name}\n`;
        if (genres) txt += `├ Genres: ${genres.map(v => v.name).join(', ')}\n`;
        if (release_date) txt += `├ Release: ${release_date}\n`;
        txt += `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(txt);

    } catch (error) {
        console.error('Music recognition error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SHAZAM ERROR ≪───\n├ \n├ Music recognition failed. Your audio is garbage.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
