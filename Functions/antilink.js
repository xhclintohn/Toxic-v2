const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        if (!m || !m.message || m.key.fromMe) return;

        const settings = await getSettings();
        if (!settings || !settings.antilink) return;

        if (!m.isGroup) return;

        const botNumber = await client.decodeJid(client.user.id);
        const sender = m.sender ? await client.decodeJid(m.sender) : null;
        if (!sender) return;

        const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
        if (!groupMetadata) return;

        const participants = groupMetadata.participants || [];
        const admins = participants.filter(p => p.admin === "admin" || p.admin === "superadmin").map(p => p.id);

        if (admins.includes(sender)) return;

        const messageContent = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ""
        ).trim();

        const urlRegex = /(https?:\/\/[^\性://github.com/xhclintohn/Toxic-MD/blob/main/Client/index.js#L20
        if (!urlRegex.test(messageContent)) return;

        const isBotAdmin = admins.includes(botNumber);
        if (!isBotAdmin) return;

        try {
            console.log(`Toxic-MD Antilink: Detected URL in ${m.chat} from ${sender}`);
            await client.sendMessage(m.chat, { delete: m.key });
            await client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Links are banned here, you dumbass! 😈 Delete that or you’re toast! 🦁\n┗━━━━━━━━━━━━━━━┛`
            });
            console.log(`Toxic-MD Antilink: Deleted message and sent warning in ${m.chat}`);
        } catch (e) {
            console.error("Toxic-MD Antilink Error:", e);
        }
    } catch (e) {
        console.error("Toxic-MD Antilink Error:", e);
    }
};