const { getWarnCount, getWarnLimit } = require('../../database/config');
const middleware = require('../../utils/botUtil/middleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

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
    await middleware(context, async () => {
        const { client, m, args } = context;
        const fq = getFakeQuoted(m);

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ WARN COUNT ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

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

        if (!rawJid) {
            return await client.sendMessage(m.chat, { text: fmt("Tag someone or reply to their message. I can't read minds, fool. 😒") }, { quoted: fq });
        }

        const target = resolveTarget(rawJid, participants);
        if (!target) {
            return await client.sendMessage(m.chat, { text: fmt("Couldn't find that person in this group. 🙄") }, { quoted: fq });
        }

        const targetInGroup = participants.find(p => {
            const pid = (p.jid || p.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');
            return pid === target.split('@')[0];
        });
        if (!targetInGroup) {
            return await client.sendMessage(m.chat, { text: fmt("That person isn't even in this group. Are you seeing ghosts? 👻") }, { quoted: fq });
        }

        const username = target.split('@')[0];
        const count = await getWarnCount(m.chat, target);
        const limit = await getWarnLimit(m.chat);
        const remaining = limit - count;

        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ WARN COUNT ≪───\n├ \n├ 📊 @${username}\n├ Warns: *${count}/${limit}*\n├ Remaining: *${remaining}*\n├ ${count === 0 ? 'Clean record. For now. 😏' : remaining <= 1 ? "One more and they're OUT. 💀" : 'Walking on thin ice. ⚠️'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [target]
        }, { quoted: fq });
    });
};
