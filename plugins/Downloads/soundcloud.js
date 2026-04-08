const axios = require('axios');

module.exports = {
    name: 'soundcloud',
    alias: ['scloud', 'scdl'],
    description: 'Download audio from SoundCloud',
    run: async (context) => {
        const { client, m, text, prefix } = context;
        if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SOUNDCLOUD DL ≪───\n├ \n├ Usage: ${prefix}soundcloud <url>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (!text.match(/soundcloud\.com/i)) return m.reply('That doesn\'t look like a SoundCloud link.');
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const { data } = await axios.get(`https://api.siputzx.my.id/api/d/soundcloud?url=${encodeURIComponent(text)}`, { timeout: 20000 });
            if (!data?.data) throw new Error('no data');
            const result = data.data;
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            if (result.thumbnail) {
                await client.sendMessage(m.chat, { image: { url: result.thumbnail }, caption: `*${result.title || 'SoundCloud Track'}*` }, { quoted: m });
            }
            await client.sendMessage(m.chat, {
                audio: { url: result.audio || result.url },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply('╭───(    TOXIC-MD    )───\n├ Failed to download SoundCloud track.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }
    }
};
