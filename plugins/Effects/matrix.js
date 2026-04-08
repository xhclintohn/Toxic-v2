const mumaker = require('mumaker');

module.exports = {
    name: 'matrix',
    alias: ['matrixtext', 'matrixlogo'],
    description: 'Generate matrix text effect',
    run: async (context) => {
        const { client, m, text, prefix } = context;
        if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ MATRIX TEXT ≪───\n├ \n├ Usage: ${prefix}matrix YourText\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (text.length > 30) return m.reply(`╭───(    TOXIC-MD    )───\n├ Text too long. Max 30 chars.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const result = await mumaker.ephoto('https://en.ephoto360.com/matrix-text-effect-154.html', text.trim());
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { image: result, caption: `╭───(    TOXIC-MD    )───\n├───≫ MATRIX TEXT ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(`╭───(    TOXIC-MD    )───\n├ Effect failed. Try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
