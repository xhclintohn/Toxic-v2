const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ You stupid fuck, type some text already!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    if (text.length > 50) return m.reply("╭───(    TOXIC-MD    )───\n├ Text too long, shorten it you brain-dead idiot!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const url = `https://api.nekolabs.web.id/canvas/ephoto/glowing-text?text=${encodeURIComponent(text.trim())}`;
        const response = await fetch(url);

        if (!response.ok) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("╭───(    TOXIC-MD    )───\n├ API fucked up. Try again later, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const buffer = await response.buffer();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            image: buffer,
            caption: "╭───(    TOXIC-MD    )───\n├───≫ GLOWING TEXT ≪───\n├ \n├ Glowing text, blinding trash for blinding fools.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧"
        }, { quoted: m });

    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply("╭───(    TOXIC-MD    )───\n├ Shit broke. Probably your fault.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }
};
