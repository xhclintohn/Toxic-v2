const { getSettings } = require("../Database/config");

module.exports = async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;

        const settings = await getSettings();
        const mode = (settings.antistatusmention || "off").toLowerCase();

        if (mode === "off") return;
        if (m.mtype !== 'groupStatusMentionMessage') return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        if (isAdmin) return;
        if (!isBotAdmin) return;

        // Always delete the message first
        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender,
            },
        });

        // Send notification for delete mode
        if (mode === "delete") {
            await client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Status mention deleted\n│❒ User: @${m.sender.split("@")[0]}\n┗━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender],
            });
        }
        
        // Remove user if mode is remove
        if (mode === "remove") {
            const user = m.sender;
            const tag = user.split("@")[0];

            try {
                await client.groupParticipantsUpdate(m.chat, [user], "remove");
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Removed for status mention\n│❒ User: @${tag}\n┗━━━━━━━━━━━━━━━┛`,
                    mentions: [user],
                });
            } catch {
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Can't remove user\n│❒ Missing admin permissions\n┗━━━━━━━━━━━━━━━┛`,
                });
            }
        }
    } catch (err) {}
};