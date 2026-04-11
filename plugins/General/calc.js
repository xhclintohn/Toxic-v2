const { getFakeQuoted } = require('../../lib/fakeQuoted');

const ALLOWED = /^[0-9+\-*/.()%^ ]+$/;

module.exports = {
    name: 'calc',
    aliases: ['calculate', 'math', 'solve'],
    description: 'Evaluate a mathematical expression',
    run: async (context) => {
        const { client, m, text } = context;
        const fq = getFakeQuoted(m);
        const expr = (text || '').trim();
        if (!expr) {
            return client.sendMessage(m.chat, {
                text: '╭───(    TOXIC-MD    )───\n├───≫ Cᴀʟᴄᴜʟᴀᴛᴏʀ ≪───\n├\n├ Give me an expression. Usage: .calc 2+2\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
            }, { quoted: fq });
        }
        if (!ALLOWED.test(expr)) {
            return client.sendMessage(m.chat, {
                text: '╭───(    TOXIC-MD    )───\n├───≫ Cᴀʟᴄᴜʟᴀᴛᴏʀ ≪───\n├\n├ Only numbers and operators please. No tricks.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
            }, { quoted: fq });
        }
        try {
            // eslint-disable-next-line no-new-func
            const result = Function('"use strict"; return (' + expr + ')')();
            if (result === undefined || result === null || !isFinite(result)) throw new Error('invalid result');
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Cᴀʟᴄᴜʟᴀᴛᴏʀ ≪───\n├\n├ 🔢 ${expr}\n├ = ${result}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        } catch (e) {
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Cᴀʟᴄᴜʟᴀᴛᴏʀ ≪───\n├\n├ That expression is broken. Fix your math.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }
    }
};
