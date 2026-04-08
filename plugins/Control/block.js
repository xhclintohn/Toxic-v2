const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const getMentionedJid = (m) => {
    if (m.msg?.contextInfo?.mentionedJid?.length > 0) return m.msg.contextInfo.mentionedJid[0];
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) return m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    return null;
};

const resolveTarget = (jid, participants) => {
    if (!jid) return null;
    const server = (jid.split('@')[1] || '').toLowerCase();
    const user = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!user) return null;
    if (server === 'lid') {
        const match = participants.find(p => {
            const lid = (p.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');
            return lid === user;
        });
        if (match) return (match.jid || match.id).split(':')[0].split('@')[0].replace(/\D/g, '') + '@s.whatsapp.net';
        return user + '@s.whatsapp.net';
    }
    const match = participants.find(p => {
        const pid = (p.jid || p.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        return pid === user || pid.endsWith(user) || user.endsWith(pid);
    });
    if (match) return (match.jid || match.id).split(':')[0].split('@')[0].replace(/\D/g, '') + '@s.whatsapp.net';
    return user + '@s.whatsapp.net';
};

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;

        let rawJid = null;

        if (m.quoted?.sender) {
            rawJid = m.quoted.sender;
        } else {
            const mentioned = getMentionedJid(m);
            if (mentioned) rawJid = mentioned;
        }

        if (!rawJid && text && text.replace(/[^0-9]/g, '')) {
            rawJid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!rawJid) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Tag or reply to a user to block.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        let blockJid = rawJid;

        if (rawJid.endsWith('@lid') || rawJid.includes(':')) {
            try {
                const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat) : { participants: [] };
                blockJid = resolveTarget(rawJid, groupMetadata.participants);
            } catch {
                blockJid = rawJid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
            }
        }

        if (!blockJid) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Couldn't resolve that user.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        try {
            await client.updateBlockStatus(blockJid, 'block');
            const parts = blockJid.split('@')[0];
            return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ BLOCKED ≪───\n├ \n├ ${parts} is blocked. Good riddance.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } catch (e) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Failed to block that user.\n├ ${e?.message || 'Unknown error'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
