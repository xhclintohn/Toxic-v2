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

        const isBotAdmin = admins.includes(botNumber);
        if (!isBotAdmin) {
            console.error("Toxic-MD Antilink Error: Bot is not an admin in group", m.chat);
            return;
        }

        const messageContent = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            ""
        ).toLowerCase();

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
        if (!urlRegex.test(messageContent)) return;

        try {
            console.log(`Toxic-MD Antilink: Attempting to delete message in ${m.chat} with key:`, m.key);
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: sender
                }
            });
            await client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Links are banned here, you dumbass! 😠 Don't send links again or you're toast! 💀\n┗━━━━━━━━━━━━━━━┛`
            });
        } catch (e) {
            console.error("Toxic-MD Antilink Error:", e);
        }
    } catch (e) {
        console.error("Toxic-MD Antilink Error:", e);
    }
};