const { getSettings } = require("../Database/config");

module.exports = async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;

        const settings = await getSettings();
        const mode = (settings.antistatusmention || "off").toLowerCase();

        if (mode === "off") return;
        
        const isStatusMention = 
            m.message.groupStatusMentionMessage ||
            m.message?.ephemeralMessage?.message?.groupStatusMentionMessage ||
            m.message?.viewOnceMessage?.message?.groupStatusMentionMessage;
        
        if (!isStatusMention) return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        if (isAdmin) return;
        if (!isBotAdmin) return;

        const user = m.sender;
        const tag = user.split("@")[0];

        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: user,
            },
        });

        if (mode === "delete") {
            await client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Toxic-MD AntiStatusMention*\n│❒ Violation detected!\n│❒ User: @${tag}\n│❒ Action: Status mention deleted 🗑️\n│❒ Warning: Next violation = removal\n┗━━━━━━━━━━━━━━━┛`,
                mentions: [user],
            });
        }

        if (mode === "remove") {
            try {
                await client.groupParticipantsUpdate(m.chat, [user], "remove");
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Toxic-MD AntiStatusMention*\n│❒ Violation detected!\n│❒ User: @${tag}\n│❒ Action: Removed from group 🚫\n│❒ Reason: Status mention violation\n┗━━━━━━━━━━━━━━━┛`,
                    mentions: [user],
                });
            } catch {
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Toxic-MD Admin Error*\n│❒ Can't remove @${tag}\n│❒ I need admin permissions\n┗━━━━━━━━━━━━━━━┛`,
                    mentions: [user],
                });
            }
        }
    } catch (err) {}
};