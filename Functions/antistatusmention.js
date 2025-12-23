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

        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender,
            },
        });

        setTimeout(async () => {
            if (mode === "delete") {
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Status Mention Alert!*\n│❒ User: @${m.sender.split("@")[0]}\n│❒ Action: Message deleted 🗑️\n│❒ Warning: Next time won't be nice 😈\n┗━━━━━━━━━━━━━━━┛`,
                    mentions: [m.sender],
                });
            }

            if (mode === "remove") {
                const user = m.sender;
                const tag = user.split("@")[0];

                try {
                    await client.groupParticipantsUpdate(m.chat, [user], "remove");
                    await client.sendMessage(m.chat, {
                        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Status Mention Violation!*\n│❒ User: @${tag}\n│❒ Action: Removed from group 🚫\n│❒ Reason: No status mentions allowed\n┗━━━━━━━━━━━━━━━┛`,
                        mentions: [user],
                    });
                } catch {
                    await client.sendMessage(m.chat, {
                        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ *Admin Permission Issue*\n│❒ Can't remove violator\n│❒ Fix my admin rights, boss 🔧\n┗━━━━━━━━━━━━━━━┛`,
                    });
                }
            }
        }, 500);
    } catch (err) {}
};