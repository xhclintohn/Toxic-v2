const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const getMentionedJid = (m) => {
    if (m.msg?.contextInfo?.mentionedJid?.length > 0) return m.msg.contextInfo.mentionedJid[0];
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) return m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    if (m.quoted?.mentionedJid?.length > 0) return m.quoted.mentionedJid[0];
    if (m.quoted?.contextInfo?.mentionedJid?.length > 0) return m.quoted.contextInfo.mentionedJid[0];
    return null;
};

const resolveBlockJid = async (rawJid, client) => {
    if (!rawJid) return null;
    const server = rawJid.split('@')[1] || '';
    const user = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!user) return null;

    if (server === 'lid') {
        try {
            const decoded = client.decodeJid(rawJid);
            if (decoded && !decoded.includes('@lid')) return decoded.split(':')[0].split('@')[0].replace(/\D/g, '') + '@s.whatsapp.net';
        } catch (e) {}
        return null;
    }

    return user + '@s.whatsapp.net';
};

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;

        const mentioned = getMentionedJid(m);
        const rawJid = mentioned || (m.quoted?.sender) || (text?.replace(/[^0-9]/g, '') ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null);

        if (!rawJid) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Tag or reply to a user to block.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const users = await resolveBlockJid(rawJid, client);

        if (!users) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Couldn't resolve that user's JID.\n├ Try replying to their message instead. 😤\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const parts = users.split('@')[0];
        await client.updateBlockStatus(users, 'block');
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BLOCKED ≪───\n├ \n├ ${parts} is blocked. Good riddance.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
