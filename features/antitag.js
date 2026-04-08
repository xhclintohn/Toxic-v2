const { getGroupSettings } = require("../database/config");

const DEV_NUMBER = '254114885159';
const normalizeNumber = (jid) => {
    if (!jid) return '';
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

module.exports = async (client, m, isBotAdmin, itsMe, isAdmin, Owner, body) => {
    if (!m.isGroup) return;
    const isDev = normalizeNumber(m.sender) === normalizeNumber(DEV_NUMBER);
    if (isDev) return;

    const groupSettings = await getGroupSettings(m.chat);
    const antitag = groupSettings?.antitag;

    if (antitag && !Owner && isBotAdmin && !isAdmin && m.mentionedJid && m.mentionedJid.length > 10) {
        if (itsMe) return;
        const kid = m.sender;
        try {
            await client.sendMessage(m.chat, { text: `@${kid.split("@")[0]}, do not tag!`, contextInfo: { mentionedJid: [kid] } }, { quoted: m });
            await client.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: kid } });
            await client.groupParticipantsUpdate(m.chat, [kid], "remove");
        } catch (e) {}
    }
};
