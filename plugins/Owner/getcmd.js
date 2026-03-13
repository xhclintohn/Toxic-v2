const fs = require('fs').promises;

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    const allowedNumber = '254735342808@s.whatsapp.net';
    if (m.sender !== allowedNumber) {
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ ACCESS DENIED ≪───\n├ \n├ This command is restricted to the bot owner.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }

    if (!text) {
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├ Provide a command name, genius!\n├ Usage: ${prefix}getcmd <commandname>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }

    const categories = ['General', 'Settings', 'Owner', 'Heroku', 'Privacy', 'Groups', 'Ai-Tools', '+18', 'Logo', 'Search', 'Coding', 'Downloads', 'Editing', 'Utils'];
    const commandName = text.trim().endsWith('.js') ? text.trim().slice(0, -3) : text.trim();
    let fileFound = false;

    for (const category of categories) {
        const filePath = `./plugins/${category}/${commandName}.js`;
        try {
            const data = await fs.readFile(filePath, 'utf8');

            const replyText = `╭───(    TOXIC-MD    )───\n├───≫ COMMAND FILE ≪───\n├ \n├ File: ${commandName}.js\n├ Category: ${category}\n├ \n\`\`\`javascript\n${data}\n\`\`\`\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
            await client.sendMessage(m.chat, { text: replyText }, { quoted: m });

            const tmpPath = `/tmp/${commandName}.js`;
            await fs.writeFile(tmpPath, data);
            const fileBuffer = await fs.readFile(tmpPath);
            await client.sendMessage(m.chat, {
                document: fileBuffer,
                fileName: `${commandName}.js`,
                mimetype: 'application/javascript',
                caption: `${commandName}.js`
            }, { quoted: m });
            await fs.unlink(tmpPath).catch(() => {});

            fileFound = true;
            break;
        } catch (err) {
            if (err.code !== 'ENOENT') {
                return await client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Error reading file: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: m });
            }
        }
    }

    if (!fileFound) {
        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ NOT FOUND ≪───\n├ \n├ Command not found: ${commandName}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }
};
