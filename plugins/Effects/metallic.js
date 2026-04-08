const { ephoto } = require('../../lib/ephoto');
const fetch = require('node-fetch');

module.exports = {
    name: 'metallic',
    alias: ["metaltext","metallogo"],
    description: 'Generate metallic text image effect',
    run: async (context) => {
        const { client, m, text, prefix } = context;
        if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ METALLIC TEXT ≪───\n├ \n├ Usage: ${prefix}metallic YourText\n├ Max 30 characters.\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        if (text.length > 30) return m.reply(`╭───(    TOXIC-MD    )───\n├ Text too long. Max 30 chars.\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            const raw = await ephoto('https://ephoto360.com/create-golden-3d-text-effect-online-814.html', text.trim());
            let imgBuffer;
            if (Buffer.isBuffer(raw)) {
                imgBuffer = raw;
            } else {
                const imgUrl = raw?.src || raw?.image || raw?.url || (typeof raw === 'string' ? raw : null);
                if (!imgUrl) throw new Error('no image url');
                const res = await fetch(imgUrl, { timeout: 15000 });
                imgBuffer = await res.buffer();
            }
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, {
                image: imgBuffer,
                caption: `╭───(    TOXIC-MD    )───\n├───≫ METALLIC TEXT ≪───\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        } catch {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(`╭───(    TOXIC-MD    )───\n├ Effect generation failed. Try again later.\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
