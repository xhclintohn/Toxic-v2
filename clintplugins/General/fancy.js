const fetch = require('node-fetch');

module.exports = {
    name: 'fancy',
    aliases: ['fancytext', 'style', 'stylish'],
    description: 'Shows all available fancy font styles',
    run: async (context) => {
        const { client, m, prefix } = context;

        await client.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        try {
            const response = await fetch('https://movanest.zone.id/v2/fancytext?word=Toxic');
            const data = await response.json();

            if (!data.status || !data.results || data.results.length === 0) {
                return m.reply("API's dead or being a bitch. Try again later.");
            }

            let msg = `*FANCY FONT MENU* 🔥\n\n`;
            msg += `Found *${data.count}* styles. Pick one by replying with:\n`;
            msg += `*${prefix}fancy<number> your text*\n\n`;
            msg += `Example: ${prefix}fancy1 Toxic-MD\n`;
            msg += `Example: ${prefix}fancy42 Hello\n\n`;
            msg += `──────────────────\n\n`;

            data.results.forEach((style, i) => {
                msg += `*${i + 1}.* ${style}\n`;
            });

            msg += `\n> Powered by Toxic-MD 💀`;

            await client.sendMessage(m.chat, { text: msg }, { quoted: m });

        } catch (error) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply("Failed to load fonts. The API is probably crying. Try later.");
        }
    }
};