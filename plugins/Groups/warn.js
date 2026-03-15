const { getWarnCount, incrementWarn, resetWarn, getWarnLimit } = require('../../database/config');
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
        const { client, m, args } = context;

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ WARN ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (!m.isGroup) {
            return await client.sendMessage(m.chat, { text: fmt('Groups only, genius. 😤') }, { quoted: m });
        }

        if (!m.isBotAdmin) {
            return await client.sendMessage(m.chat, { text: fmt("Bot isn't admin here. Can't do anything without power, obviously. 🙄") }, { quoted: m });
        }

        let target = null;

        if (m.quoted && m.quoted.sender) {
            target = normalizeJid(m.quoted.sender);
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = normalizeJid(m.message.extendedTextMessage.contextInfo.mentionedJid[0]);
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) {
            return await client.sendMessage(m.chat, { text: fmt('Tag someone or reply to their message, fool. I need a target. 😒') }, { quoted: m });
        }

        const groupMetadata = await client.groupMetadata(m.chat);
        const targetInGroup = groupMetadata.participants.find(p => normalizeJid(p.id) === target || normalizeJid(p.jid) === target);

        if (!targetInGroup) {
            return await client.sendMessage(m.chat, { text: fmt("That person isn't even in this group. Are you hallucinating? 🙄") }, { quoted: m });
        }

        if (targetInGroup.admin !== null) {
            return await client.sendMessage(m.chat, { text: fmt("Can't warn admins, idiot. Warn regular members like you. 😏") }, { quoted: m });
        }

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
