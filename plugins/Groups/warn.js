const { getWarnCount, incrementWarn, resetWarn, getWarnLimit } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const getMentionedJid = (m) => {
    if (m.msg?.contextInfo?.mentionedJid?.length > 0) return m.msg.contextInfo.mentionedJid[0];
    if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) return m.message.extendedTextMessage.contextInfo.mentionedJid[0];
    if (m.quoted?.mentionedJid?.length > 0) return m.quoted.mentionedJid[0];
    if (m.quoted?.contextInfo?.mentionedJid?.length > 0) return m.quoted.contextInfo.mentionedJid[0];
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

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args } = context;

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ WARN ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (!m.isGroup) return await client.sendMessage(m.chat, { text: fmt('Groups only, genius. 😤') }, { quoted: m });
        if (!m.isBotAdmin) return await client.sendMessage(m.chat, { text: fmt("Bot isn't admin here. Can't do anything without power, obviously. 🙄") }, { quoted: m });

        const groupMetadata = await client.groupMetadata(m.chat);
        const participants = groupMetadata.participants;

        let rawJid = null;
        if (m.quoted && m.quoted.sender) {
            rawJid = m.quoted.sender;
        } else {
            const mentioned = getMentionedJid(m);
            if (mentioned) rawJid = mentioned;
        }
        if (!rawJid && args[0]) rawJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        if (!rawJid) return await client.sendMessage(m.chat, { text: fmt('Tag someone or reply to their message, fool. I need a target. 😒') }, { quoted: m });

        const target = resolveTarget(rawJid, participants);
        if (!target) return await client.sendMessage(m.chat, { text: fmt("Couldn't find that person in this group. 🙄") }, { quoted: m });

        const targetInGroup = participants.find(p => {
            const pid = (p.jid || p.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');
            return pid === target.split('@')[0];
        });
        if (!targetInGroup) return await client.sendMessage(m.chat, { text: fmt("That person isn't even in this group. Are you hallucinating? 🙄") }, { quoted: m });
        if (targetInGroup.admin !== null) return await client.sendMessage(m.chat, { text: fmt("Can't warn admins, idiot. Warn regular members like you. 😏") }, { quoted: m });

        const MAX_WARNS = await getWarnLimit(m.chat);
        const newCount = await incrementWarn(m.chat, target);
        const username = target.split('@')[0];

        if (newCount >= MAX_WARNS) {
            await resetWarn(m.chat, target);
            await client.groupParticipantsUpdate(m.chat, [target], 'remove');
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ KICKED ≪───\n├ \n├ 🚨 @${username} got warn #${newCount}/${MAX_WARNS}\n├ That's ${MAX_WARNS} strikes. KICKED. Bye bye. 😈\n├ Warn count reset. Slate wiped clean.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [target]
            }, { quoted: m });
        }

        const remaining = MAX_WARNS - newCount;
        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ WARNED ≪───\n├ \n├ ⚠️ @${username} has been warned!\n├ Warns: ${newCount}/${MAX_WARNS}\n├ ${remaining} more and you're OUT. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [target]
        }, { quoted: m });
    });
};
