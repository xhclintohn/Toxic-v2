const axios = require('axios');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'fact',
    aliases: ['funfact', 'randomfact', 'trivia'],
    description: 'Get a random interesting fact',
    run: async (context) => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const res = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en', { timeout: 8000 });
            const factText = res.data?.text || 'No fact available.';
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Rᴀɴᴅᴏᴍ Fᴀᴄᴛ ≪───\n├\n├ 🧠 ${factText}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return client.sendMessage(m.chat, { text: '╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├\n├ Facts took a vacation. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: fq });
        }
    }
};
