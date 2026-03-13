const { getGroupSettings } = require("../database/config");

module.exports = async (client, m) => {
    try {
        if (!m || !m.chat || !m.chat.endsWith('@g.us')) return;
        if (m.key?.fromMe) return;

        const groupSettings = await getGroupSettings(m.chat);
        const antilinkMode = (groupSettings.antilink || "off").toLowerCase();
        if (antilinkMode === "off") return;

        const isAdmin = m.isAdmin === true;
        const isBotAdmin = m.isBotAdmin === true;

        if (isAdmin || !isBotAdmin) return;

        const msg = m.message || {};
        const innerMsg =
            msg.extendedTextMessage ||
            msg.imageMessage ||
            msg.videoMessage ||
            msg.documentMessage ||
            msg.audioMessage ||
            msg.stickerMessage ||
            msg.conversation ||
            null;

        const contextInfo =
            (typeof innerMsg === 'object' && innerMsg?.contextInfo) ||
            msg.contextInfo ||
            null;

        const isForwarded = contextInfo?.isForwarded === true;
        const forwardingScore = contextInfo?.forwardingScore || 0;
        const originJid = contextInfo?.remoteJid || '';
        const isChannelForward = isForwarded && (forwardingScore >= 1 || originJid.endsWith('@newsletter'));

        const text = (
            m.text ||
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            msg.documentMessage?.caption ||
            ""
        ).toLowerCase();

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,6}(\/[^\s]*)?)/gi;
        const hasPreview = msg.extendedTextMessage?.matchedText || msg.extendedTextMessage?.canonicalUrl;
        const hasLink = urlRegex.test(text) || !!hasPreview;

        if (!isChannelForward && !hasLink) return;

        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender || m.key.participant
            }
        });

        const reason = isChannelForward ? '📡 Channel forward not allowed!' : '🔗 No links allowed!';
        await client.sendMessage(m.chat, {
            text: `╭───( *Toxic-MD Antilink* )───\n` +
                  `│ 😒 @${m.sender.split("@")[0]}, ${reason}\n` +
                  `│ 🧹 Message deleted.\n` +
                  (antilinkMode === "remove" ? `│ 🚪 Get ready to leave...\n` : `│ ⚠️ Final warning.\n`) +
                  `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [m.sender]
        });

        if (antilinkMode === "remove") {
            await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
        }

    } catch (err) {
        console.error("Antilink Error:", err);
    }
};
