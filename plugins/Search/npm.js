const fetch = require('node-fetch');

module.exports = {
    name: 'npm',
    aliases: ['npmsearch', 'npmjs'],
    description: 'Search for NPM packages',
    run: async (context) => {
        const { client, m } = context;

        try {
            const query = m.text.trim();
            if (!query) return m.reply("╭───(    TOXIC-MD    )───\n├ Give me a package name, you useless human.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            
            const response = await fetch(`https://api-faa.my.id/faa/npmjs?name=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (!data.status || !data.result || data.result.length === 0) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return m.reply(`╭───(    TOXIC-MD    )───\n├ No packages found for "${query}".\n├ Your search skills are as bad as your life choices.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            let resultText = "╭───(    TOXIC-MD    )───\n├───≫ NPM SEARCH ≪───\n├ \n";
            const firstFive = data.result.slice(0, 5);
            
            firstFive.forEach((pkg, index) => {
                resultText += `├ ${index + 1}. ${pkg.name} v${pkg.version}\n`;
                resultText += `├   ${pkg.description}\n`;
                resultText += `├   ${pkg.link}\n├ \n`;
            });

            if (data.result.length > 5) {
                resultText += `├ ...and ${data.result.length - 5} more results\n`;
            }

            resultText += "╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧";

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await m.reply(resultText);

        } catch (error) {
            console.error('NPM search error:', error);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ NPM ERROR ≪───\n├ \n├ NPM search failed. ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
