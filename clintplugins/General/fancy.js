const fetch = require('node-fetch');

module.exports = {
    name: 'fancy',
    aliases: ['fancytext', 'style', 'stylish'],
    description: 'Transform text into aesthetic fancy styles',
    run: async (context) => {
        const { client, m, prefix } = context;

        const args = m.body?.split(" ") || [];
        const text = args.slice(1).join(" ").trim();

        if (!text) {
            return client.sendMessage(m.chat, {
                text: `Yo @${m.pushName}, you want fancy text but forgot the text? 🙄\nExample: ${prefix}fancy Toxic-MD\nStop wasting my time, moron.`
            }, { quoted: m });
        }

        await client.sendMessage(m.chat, { react: { text: '✨', key: m.key } });

        try {
            const apiUrl = `https://movanest.zone.id/v2/fancytext?word=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!data.status || !data.results || data.results.length === 0) {
                return client.sendMessage(m.chat, {
                    text: `Fancy API failed. Your text "${text}" is probably too cringe even for styling. 🤦🏻`
                }, { quoted: m });
            }

            const fancyTexts = data.results.slice(0, 15);
            
            let resultText = `*Fancy Text Results for "${text}"*\n`;
            resultText += `Found ${data.count} styles. Showing top 15:\n\n`;
            
            fancyTexts.forEach((style, index) => {
                resultText += `${index + 1}. ${style}\n`;
            });
            
            resultText += `\n> Powered by Toxic-MD`;

            await client.sendMessage(m.chat, {
                text: resultText
            }, { quoted: m });

        } catch (error) {
            console.error('Fancy error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await client.sendMessage(m.chat, {
                text: `Fancy text failed. Your text probably broke the API.\nError: ${error.message}`
            }, { quoted: m });
        }
    },
};