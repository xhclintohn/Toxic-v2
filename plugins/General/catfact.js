const axios = require('axios');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'catfact',
    aliases: ['catfacts', 'meowfact'],
    description: 'Get a random cat fact',
    run: async (context) => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        try {
            const res = await axios.get('https://catfact.ninja/fact', { timeout: 8000 });
            const f = res.data?.fact || 'Cats are superior. That\'s the only fact.';
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Cᴀᴛ Fᴀᴄᴛ ≪───\n├\n├ 🐱 ${f}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        } catch {
            return client.sendMessage(m.chat, { text: '╭───(    TOXIC-MD    )───\n├───≫ Cᴀᴛ Fᴀᴄᴛ ≪───\n├\n├ Even the cats won\'t talk to me right now.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: fq });
        }
    }
};
