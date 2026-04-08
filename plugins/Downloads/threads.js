const axios = require('axios');

module.exports = {
    name: 'threads',
    alias: ['threadsdl', 'tdl'],
    description: 'Download media from Threads',
    run: async (context) => {
        const { client, m, text, prefix } = context;
        if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ THREADS DL ≪───\n├ \n├ Usage: ${prefix}threads <url>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!text.match(/threads\.net/i)) return m.reply('That doesn\'t look like a Threads link.');
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const { data } = await axios.get(`https://api.siputzx.my.id/api/d/threads?url=${encodeURIComponent(text)}`, { timeout: 15000 });
            if (!data?.data) throw new Error('no data');
            const result = data.data;
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            if (result.video) {
                await client.sendMessage(m.chat, {
                    video: { url: result.video },
                    caption: `╭───(    TOXIC-MD    )───\n├───≫ THREADS VIDEO ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: m });
            } else if (result.image || result.images?.[0]) {
                const imgUrl = result.image || result.images[0];
                await client.sendMessage(m.chat, {
                    image: { url: imgUrl },
                    caption: `╭───(    TOXIC-MD    )───\n├───≫ THREADS IMAGE ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: m });
            } else {
                throw new Error('no media found');
            }
        } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply('╭───(    TOXIC-MD    )───\n├ No downloadable media found in that link.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }
    }
};
