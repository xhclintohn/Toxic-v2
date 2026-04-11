const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'password',
    aliases: ['genpass', 'passgen', 'strongpass'],
    description: 'Generate a strong random password',
    run: async (context) => {
        const { client, m, text } = context;
        const fq = getFakeQuoted(m);
        const len = Math.min(Math.max(parseInt(text || '16') || 16, 8), 64);
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let pass = '';
        for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
        return client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ Pᴀssᴡᴏʀᴅ Gᴇɴ ≪───\n├\n├ 🔐 Length: ${len} chars\n├\n├ ${pass}\n├\n├ Save it. I won't regenerate it for you.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
    }
};
