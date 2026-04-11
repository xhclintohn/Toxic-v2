const { getAnime } = require('../../lib/toxicApi');

module.exports = {
    name: 'kitsune',
    aliases: ['foxgirl', 'kitsuneani'],
    description: 'Get a random kitsune (fox girl) anime image',
    run: async (context) => {
        const { client, m } = context;
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const url = await getAnime('kitsune');
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, {
                image: { url },
                caption: '╭───(    TOXIC-MD    )───\n├───≫ Kɪᴛsᴜɴᴇ ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
            }, { quoted: m });
        } catch (error) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply('╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Kitsune escaped!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }
    }
};
