const fs = require('fs').promises;
const path = require('path');

const normalizeNumber = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

const DEVELOPER = normalizeNumber('254114885159');
const MAX_TEXT_SIZE = 3000;
const FEATURES_DIR = path.join(__dirname, '..', '..', 'features');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (normalizeNumber(m.sender) !== DEVELOPER) {
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ ACCESS DENIED ≪───\n├ \n├ This command is restricted to the bot owner.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }

    if (!text) {
        let files = [];
        try { const entries = await fs.readdir(FEATURES_DIR); files = entries.filter(f => f.endsWith('.js')); } catch {}
        const fileList = files.map(f => `├ • ${f.replace('.js', '')}`).join('\n');
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ GETFUNC ≪───\n├ \n├ Usage: ${prefix}getfunc <name>\n├ \n├ Available features:\n${fileList || '├ (none found)'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }

    const funcName = text.trim().endsWith('.js') ? text.trim().slice(0, -3) : text.trim();
    const filePath = path.join(FEATURES_DIR, `${funcName}.js`);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        const fileBuffer = Buffer.from(data, 'utf8');

        if (data.length <= MAX_TEXT_SIZE) {
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ FEATURE FILE ≪───\n├ \n├ File: ${funcName}.js\n├ Size: ${data.length} chars\n├ \n\`\`\`javascript\n${data}\n\`\`\`\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }

        await client.sendMessage(m.chat, {
            document: fileBuffer,
            fileName: `${funcName}.js`,
            mimetype: 'application/javascript',
            caption: `╭───(    TOXIC-MD    )───\n├ 📄 ${funcName}.js\n├ Folder: features/\n├ Size: ${data.length} chars\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });

    } catch (err) {
        if (err.code === 'ENOENT') {
            let files = [];
            try { const entries = await fs.readdir(FEATURES_DIR); files = entries.filter(f => f.endsWith('.js')); } catch {}
            const fileList = files.map(f => `├ • ${f.replace('.js', '')}`).join('\n');
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ NOT FOUND ≪───\n├ \n├ "${funcName}" not found in features/.\n├ \n├ Available:\n${fileList || '├ (none found)'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Error reading file: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });
    }
};
