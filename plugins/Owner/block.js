const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const getMentionedJid = (m) => {
    if (m.msg?.contextInfo?.mentionedJid?.length) return m.msg.contextInfo.mentionedJid[0];
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) return m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    if (m.quoted?.sender) return m.quoted.sender;
    if (m.quoted?.mentionedJid?.length) return m.quoted.mentionedJid[0];
    if (m.quoted?.contextInfo?.mentionedJid?.length) return m.quoted.contextInfo.mentionedJid[0];
    return null;
};

const normalizeUserJid = (jid) => {
    if (!jid) return null;
    const user = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!user) return null;
    return `${user}@s.whatsapp.net`;
};

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;

        const mentioned = getMentionedJid(m);
        const numeric = text?.replace(/\D/g, '');
        const target = mentioned || (numeric ? `${numeric}@s.whatsapp.net` : null);
        const jid = normalizeUserJid(target);

        if (!jid) {
            return m.reply(`╭───(    TOXIC-MD    )───
├
├ Tag or reply to a user to block.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        try {
            await client.updateBlockStatus(jid, 'block');

            return m.reply(`╭───(    TOXIC-MD    )───
├───≫ BLOCKED ≪───
├
├ ${jid.split('@')[0]} is blocked. Good riddance.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } catch (err) {
            console.error('[BLOCK ERROR]', err);

            return m.reply(`╭───(    TOXIC-MD    )───
├
├ Failed to block user.
├ Reason: ${err?.message || 'Unknown error'}
├ Try reconnecting the bot session.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};