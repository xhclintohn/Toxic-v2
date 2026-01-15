const { getSettings } = require("../Database/config");

const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
};

module.exports = async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;

        const exemptGroup = "120363156185607326@g.us";
        if (m.chat === exemptGroup) return;

        const settings = await getSettings();
        const mode = settings.antistatusmention;

        if (!mode || mode === "off" || mode === "false") return;

        if (m.mtype !== 'groupStatusMentionMessage') return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        if (isAdmin) {
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Admin Status Mention\nUser: @${m.sender.split("@")[0]}\nAdmins are allowed ✅`),
                mentions: [m.sender],
            });
            return;
        }

        if (!isBotAdmin) {
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Not Admin! Can't stop status mentions\nUser: @${m.sender.split("@")[0]}\nMake me admin to deal with spammers! 😤`),
                mentions: [m.sender],
            });
            return;
        }

        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender,
            },
        });

        if (mode === "delete" || mode === "true") {
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Status Mention Deleted! 🗑️\nUser: @${m.sender.split("@")[0]}\nNext time = Removal! ⚠️`),
                mentions: [m.sender],
            });
        }

        if (mode === "remove") {
            try {
                await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                await client.sendMessage(m.chat, {
                    text: formatStylishReply(`User Removed! 🚫\n@${m.sender.split("@")[0]} - No status mentions allowed!`),
                    mentions: [m.sender],
                });
            } catch {
                await client.sendMessage(m.chat, {
                    text: formatStylishReply(`Can't Remove User! 😠\nNeed more power to remove @${m.sender.split("@")[0]}`),
                    mentions: [m.sender],
                });
            }
        }
    } catch (err) {}
};