const { resetWarn, getWarnCount } = require('../../database/config');
const middleware = require('../../utils/botUtil/middleware');

const normalizeJid = (jid) => {
    if (!jid) return '';
    const decoded = jid.split('@');
    const user = decoded[0].split(':')[0];
    const server = decoded[1] || '';
    if (server === 'lid') return user + '@s.whatsapp.net';
    return user + '@' + server;
};

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, args } = context;

        const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├───≫ RESET WARN ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        let target = null;

        if (m.quoted && m.quoted.sender) {
            target = normalizeJid(m.quoted.sender);
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            target = normalizeJid(m.message.extendedTextMessage.contextInfo.mentionedJid[0]);
        } else if (args[0]) {
            target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        if (!target) {
            return await client.sendMessage(m.chat, { text: fmt("Tag someone or reply to their message. Do I look like a mind reader? 😒") }, { quoted: m });
        }

        const groupMetadata = await client.groupMetadata(m.chat);
        const targetInGroup = groupMetadata.participants.find(p => normalizeJid(p.id) === target || normalizeJid(p.jid) === target);

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
