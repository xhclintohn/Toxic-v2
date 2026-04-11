const axios = require('axios');
const { GIFTED_API_KEY_FALLBACK } = require('../../keys');

const box = (title, lines) => {
    const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

module.exports = {
    name: 'gifai',
    aliases: ['gai', 'giftedai', 'gifted'],
    run: async (context) => {
        const { client, m, text, prefix } = context;
        if (!text) return m.reply(box('GIFTED AI', [`Usage: ${prefix}gifai <your question>`]));
        try {
            await client.sendMessage(m.chat, { react: { text: '🤔', key: m.key } });
            const res = await axios.get('https://api.giftedtech.co.ke/api/ai/ai', {
                params: { q: text, apikey: GIFTED_API_KEY_FALLBACK || 'gifted' },
                timeout: 25000
            });
            const reply = res.data?.result;
            if (!reply) throw new Error('no response');
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { text: box('GIFTED AI', String(reply).split('\n').filter(Boolean)) }, { quoted: m });
        } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(box('GIFTED AI', ['Something went wrong. Try again.']));
        }
    }
};
