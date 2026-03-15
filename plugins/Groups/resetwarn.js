const { resetWarn, getWarnCount } = require('../../database/config');
const middleware = require('../../utils/botUtil/middleware');

const resolveTarget = (jid, participants) => {
    if (!jid) return null;
    const user = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
    if (!user) return null;
    const match = participants.find(p => {
        const pid = (p.jid || p.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        return pid === user || pid.endsWith(user) || user.endsWith(pid);
    });
    if (match) return (match.jid || match.id).split(':')[0].split('@')[0] + '@s.whatsapp.net';
    return user + '@s.whatsapp.net';
};

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args } = context;

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ RESET WARN ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        const groupMetadata = await client.groupMetadata(m.chat);
        const participants = groupMetadata.participants;

        let rawJid = null;

        if (m.quoted && m.quoted.sender) {
            rawJid = m.quoted.sender;
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            rawJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (args[0]) {
            rawJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!rawJid) {
            return await client.sendMessage(m.chat, { text: fmt("Tag someone or reply to their message. Do I look like a mind reader? 😒") }, { quoted: m });
        }

        const target = resolveTarget(rawJid, participants);

        if (!target) {
            return await client.sendMessage(m.chat, { text: fmt("Couldn't resolve that user. 🙄") }, { quoted: m });
        }

        const targetInGroup = participants.find(p => {
            const pid = (p.jid || p.id || '').split(':')[0].split('@')[0];
            const tid = target.split('@')[0];
            return pid === tid;
        });

        if (!targetInGroup) {
            return await client.sendMessage(m.chat, { text: fmt("That person isn't even in this group. Stop wasting my time. 🙄") }, { quoted: m });
        }

        const username = target.split('@')[0];
        const currentCount = await getWarnCount(m.chat, target);

        if (currentCount === 0) {
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ RESET WARN ≪───\n├ \n├ @${username} has 0 warnings already.\n├ Nothing to reset, genius. 🙄\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [target]
            }, { quoted: m });
        }

        await resetWarn(m.chat, target);

        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ RESET WARN ≪───\n├ \n├ ✅ @${username}'s warnings reset to 0.\n├ Lucky punk gets a clean slate. Don't waste it. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [target]
        }, { quoted: m });
    });
};
