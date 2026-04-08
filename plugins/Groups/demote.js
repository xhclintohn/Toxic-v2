const middleware = require('../../utils/botUtil/middleware');

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
        return null;
    }
    const match = participants.find(p => {
        const pid = (p.jid || p.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        return pid === user || pid.endsWith(user) || user.endsWith(pid);
    });
    if (match) return (match.jid || match.id).split(':')[0].split('@')[0].replace(/\D/g, '') + '@s.whatsapp.net';
    return user + '@s.whatsapp.net';
};

module.exports = {
    name: 'demote',
    aliases: ['unadmin', 'removeadmin', 'deadmin', 'demoteuser'],
    description: 'Demotes a user from admin in a group',
    run: async (context) => {
        await middleware(context, async () => {
            const { client, m, prefix, isBotAdmin } = context;

            if (!isBotAdmin) return m.reply(`╭───(    TOXIC-MD    )───\n├ I'm not admin here. Make me admin first.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

            const groupMetadata = await client.groupMetadata(m.chat);
            const participants = groupMetadata.participants;

            let rawJid = null;
            if (m.quoted?.sender) {
                rawJid = m.quoted.sender;
            } else {
                const mentioned = getMentionedJid(m);
                if (mentioned) rawJid = mentioned;
            }

            if (!rawJid) {
                return m.reply(`╭───(    TOXIC-MD    )───\n├ Mention or quote a user. ${prefix}demote @user\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            const target = resolveTarget(rawJid, participants);
            if (!target) {
                return m.reply(`╭───(    TOXIC-MD    )───\n├ Couldn't find that person in this group.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }

            try {
                await client.groupParticipantsUpdate(m.chat, [target], 'demote');
                await client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ DEMOTED ≪───\n├ \n├ @${target.split('@')[0]} got stripped of admin.\n├ Back to being a nobody.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                    mentions: [target]
                }, { quoted: m });
            } catch (error) {
                await m.reply(`╭───(    TOXIC-MD    )───\n├ Demote failed: ${error.message?.slice(0, 60)}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            }
        });
    },
};
