const fetch = require('node-fetch');

module.exports = {
    name: 'fancy',
    aliases: ['fancytext', 'style', 'stylish'],
    description: 'Generates and sends ALL fancy styles for your text at once',
    run: async (context) => {
        const { client, m, prefix } = context;

        const args = m.body?.slice(prefix.length).trim().split(' ');
        const command = args.shift()?.toLowerCase();
        const text = args.join(' ').trim();

        if (!text) {
            return m.reply(`You forgot the text, you absolute clown.\nUsage: ${prefix}fancy Your Text Here\n\nExample: ${prefix}fancy Toxic-MD`);
        }

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        try {
            const apiUrl = `https://movanest.zone.id/v2/fancytext?word=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.status || !data.results || data.results.length === 0) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`API couldn't handle your text "${text}". Too ugly even for fancy fonts.`);
            }

            let resultMsg = `🔥 *ALL FANCY STYLES FOR:* "${text}" 🔥\n\n`;

            data.results.forEach((style) => {
                resultMsg += `${style}\n\n`;
            });

            resultMsg += `> Total: ${data.count} styles • Powered by Toxic-MD 💀`;

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await client.sendMessage(m.chat, {
                text: resultMsg
            }, { quoted: m });

        } catch (error) {
            console.error('Fancy error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            m.reply(`Fancy generation failed. The API probably choked on your text.\nTry something shorter, dumbass.`);
        }
    },
};