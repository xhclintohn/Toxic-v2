const axios = require('axios');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'advice',
    aliases: ['tip', 'lifetip', 'suggest'],
    description: 'Get a random piece of life advice',
    run: async (context) => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        try {
            const res = await axios.get('https://api.adviceslip.com/advice', { timeout: 8000 });
            const advice = res.data?.slip?.advice || 'Stop asking for advice and figure it out.';
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Aᴅᴠɪᴄᴇ ≪───\n├\n├ 💡 ${advice}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        } catch {
            return client.sendMessage(m.chat, { text: '╭───(    TOXIC-MD    )───\n├───≫ Aᴅᴠɪᴄᴇ ≪───\n├\n├ My advice? Try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: fq });
        }
    }
};
