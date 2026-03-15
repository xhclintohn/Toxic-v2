const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const normalizeJid = (jid) => {
    if (!jid) return '';
    const decoded = jid.split('@');
    const user = decoded[0].split(':')[0];
    const server = decoded[1] || '';
    if (server === 'lid') return user + '@s.whatsapp.net';
    return user + '@' + server;
};

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Tag or reply to a user to block.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        let users = m.mentionedJid[0]
            ? normalizeJid(m.mentionedJid[0])
            : m.quoted
            ? normalizeJid(m.quoted.sender)
            : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        const parts = users.split('@')[0];

        await client.updateBlockStatus(users, 'block');
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BLOCKED ≪───\n├ \n├ ${parts} is blocked. Good riddance.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
