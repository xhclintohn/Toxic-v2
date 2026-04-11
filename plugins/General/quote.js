const axios = require('axios');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'quote',
    aliases: ['inspire', 'motivation', 'qotd'],
    description: 'Get a random motivational quote',
    run: async (context) => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        try {
            const res = await axios.get('https://zenquotes.io/api/random', { timeout: 8000 });
            const q = res.data?.[0];
            if (!q) throw new Error('empty');
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Qᴜᴏᴛᴇ ≪───\n├\n├ ❝ ${q.q} ❞\n├\n├ — ${q.a}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        } catch {
            return client.sendMessage(m.chat, { text: '╭───(    TOXIC-MD    )───\n├───≫ Qᴜᴏᴛᴇ ≪───\n├\n├ No quotes today. Universe is offline.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: fq });
        }
    }
};
