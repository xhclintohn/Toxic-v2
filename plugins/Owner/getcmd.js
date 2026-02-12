const fs = require('fs').promises;

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    try {
        const allowedNumber = '254735342808@s.whatsapp.net';
        if (m.sender !== allowedNumber) {
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ ACCESS DENIED ≪───\n├ \n├ This command is restricted\n├ to the bot owner.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }

        if (!text) {
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├ \n├ Please provide a command name!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
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
                const replyText = `╭───(    TOXIC-MD    )───\n├───≫ COMMAND FILE ≪───\n├ \n├ File: ${commandName}.js\n├ \n\`\`\`javascript\n${data}\n\`\`\`\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
                await client.sendMessage(m.chat, { text: replyText }, { quoted: m });
                fileFound = true;
                break;
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    await client.sendMessage(m.chat, {
                        text: `╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Error reading command file:\n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                    }, { quoted: m });
                    return;
                }
            }
        }

        if (!fileFound) {
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ NOT FOUND ≪───\n├ \n├ Command not found: ${commandName}\n├ Try a valid command name!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }
    } catch (error) {
        console.error('Error in getcmd command:', error);
        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to process command:\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }
};
