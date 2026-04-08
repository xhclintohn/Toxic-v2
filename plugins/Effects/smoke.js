const mumaker = require('mumaker');

module.exports = {
    name: 'smoke',
    alias: ['smoketext', 'smoky'],
    description: 'Generate smoke text effect',
    run: async (context) => {
        const { client, m, text, prefix } = context;
        if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SMOKE TEXT ≪───\n├ \n├ Usage: ${prefix}smoke YourText\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (text.length > 30) return m.reply(`╭───(    TOXIC-MD    )───\n├ Text too long. Max 30 chars.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const result = await mumaker.ephoto('https://en.ephoto360.com/realistic-smoke-text-effect-online-646.html', text.trim());
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { image: result, caption: `╭───(    TOXIC-MD    )───\n├───≫ SMOKE TEXT ≪───\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(`╭───(    TOXIC-MD    )───\n├ Effect failed. Try again later.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
