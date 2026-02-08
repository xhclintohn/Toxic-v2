const fs = require('fs').promises;

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    try {
        // Restrict to your number only
        const allowedNumber = '254735342808@s.whatsapp.net';
        if (m.sender !== allowedNumber) {
            return await client.sendMessage(m.chat, {
                text: `❌ *Access denied!* This command is restricted to the bot owner.\n\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`
            }, { quoted: m });
        }

        if (!text) {
            return await client.sendMessage(m.chat, {
                text: `📜 *Please provide a command name!* Example: *${prefix}getcmd or ${prefix}cmd ping*\n\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`
            }, { quoted: m });
        }

        const categories = [
            { name: 'General' },
            { name: 'Settings' },
            { name: 'Owner' },
            { name: 'Heroku' },
            { name: 'Wa-Privacy' },
            { name: 'Groups' },
            { name: 'AI' },
            { name: '+18' },
            { name: 'Logo' },
            { name: 'Search' },
            { name: 'Coding' },
            { name: 'Media' },
            { name: 'Editing' },
            { name: 'Utils' }
        ];

        let fileFound = false;
        const commandName = text.endsWith('.js') ? text.slice(0, -3) : text;

        for (const category of categories) {
            const filePath = `./plugins/${category.name}/${commandName}.js`;

            try {
                const data = await fs.readFile(filePath, 'utf8');
                const replyText = `✅ *Command file: ${commandName}.js*\n\n\`\`\`javascript\n${data}\n\`\`\`\n\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
                await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
                fileFound = true;
                break;
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    await client.sendMessage(m.chat, {
                        text: `⚠️ *Error reading command file:* ${err.message}\n\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`
                    }, { quoted: m });
                    return;
                }
            }
        }

        if (!fileFound) {
            await client.sendMessage(m.chat, {
                text: `❌ *Command not found:* ${commandName}\n\nTry a valid command name!\n\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`
            }, { quoted: m });
        }
    } catch (error) {
        console.error('Error in getcmd command:', error);
        await client.sendMessage(m.chat, {
            text: `⚠️ *Oops! Failed to process command:* ${error.message}\n\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\nPowered by *𝐓𝐎𝐖𝐈𝐂-𝐌𝐃 𝐕3*`
        }, { quoted: m });
    }
};