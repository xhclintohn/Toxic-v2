const { getSettings } = require("../Database/config");

module.exports = async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;

        const settings = await getSettings();
        const mode = (settings.antistatusmention || "off").toLowerCase();

        if (mode === "off") return; // Do absolutely NOTHING if off

        if (m.mtype !== 'groupStatusMentionMessage') return;

        const isBotAdmin = m.isBotAdmin;
        if (!isBotAdmin) return;

        // Always delete the status mention message
        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender,
            },
        });

        // Only send warning if mode is "delete" (not "remove")
        if (mode === "delete") {
            await client.sendMessage(m.chat, {
                text:
                    `◈━━❰ *Toxic-MD AntiStatusMention* ❱━━◈\n` +
                    `│ 😒 @${m.sender.split("@")[0]}, status mentions are not allowed here.\n` +
                    `│ 🧹 Your mention got wiped.\n` +
                    `│ ⚠️ Next time won't be a warning.\n` +
                    `┗━━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender],
            });
        }

        // Kick only if mode = remove (unchanged)
        if (mode === "remove") {
            try {
                await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                await client.sendMessage(m.chat, {
                    text: `◈━━❰ *Toxic-MD* ❱━━◈\n│ 🚫 @${m.sender.split("@")[0]} yeeted for status mention.\n┗━━━━━━━━━━━━━━┛`,
                    mentions: [m.sender],
                });
            } catch {
                await client.sendMessage(m.chat, {
                    text: `◈━━❰ *Toxic-MD* ❱━━◈\n│ 🤦 Can't kick @${m.sender.split("@")[0]}. Missing admin perms.\n┗━━━━━━━━━━━━━━┛`,
                    mentions: [m.sender],
                });
            }
        }
    } catch (err) {}
};