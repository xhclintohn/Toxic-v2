const fs = require('fs').promises;
const path = require('path');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

const normalizeNumber = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

const DEVELOPER = normalizeNumber('254114885159');
const MAX_TEXT_SIZE = 3000;
const CATEGORIES = ['+18', 'Ai-Tools', 'Coding', 'Downloads', 'Editing', 'General', 'Groups', 'Heroku', 'Logo', 'Owner', 'Privacy', 'Search', 'Settings', 'Utils'];
const PLUGINS_DIR = path.join(__dirname, '..', '..', 'plugins');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;
    const fq = getFakeQuoted(m);

    if (normalizeNumber(m.sender) !== DEVELOPER) {
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ ACCESS DENIED ≪───\n├ \n├ This command is restricted to the bot owner.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
    }

    if (!text) {
        const categoryList = CATEGORIES.map(c => `├ • ${c}`).join('\n');
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ GETCMD ≪───\n├ \n├ Usage: ${prefix}getcmd <name>\n├ \n├ Categories:\n${categoryList}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
    }

    const commandName = text.trim().endsWith('.js') ? text.trim().slice(0, -3) : text.trim();
    let fileFound = false;

    for (const category of CATEGORIES) {
        const filePath = path.join(PLUGINS_DIR, category, `${commandName}.js`);
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const fileBuffer = Buffer.from(data, 'utf8');

            if (data.length <= MAX_TEXT_SIZE) {
                await client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ COMMAND FILE ≪───\n├ \n├ File: ${commandName}.js\n├ Category: ${category}\n├ Size: ${data.length} chars\n├ \n\`\`\`javascript\n${data}\n\`\`\`\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: fq });
            }

            await client.sendMessage(m.chat, {
                document: fileBuffer,
                fileName: `${commandName}.js`,
                mimetype: 'application/javascript',
                caption: `╭───(    TOXIC-MD    )───\n├ 📄 ${commandName}.js\n├ Category: ${category}\n├ Size: ${data.length} chars\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });

            fileFound = true;
            break;
        } catch (err) {
            if (err.code !== 'ENOENT') {
                return await client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Error reading file: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: fq });
            }
        }
    }

    if (!fileFound) {
        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ NOT FOUND ≪───\n├ \n├ "${commandName}" not found in any category.\n├ \n├ Tip: use ${prefix}getcmd with no args\n├ to see all categories.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
    }
};
