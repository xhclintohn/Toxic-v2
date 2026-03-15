const { getGroupSettings, getWarnCount, incrementWarn, resetWarn, getWarnLimit } = require("../database/config");

const normalizeJid = (jid) => {
    if (!jid) return '';
    const decoded = jid.split('@');
    const user = decoded[0].split(':')[0];
    const server = decoded[1] || '';
    if (server === 'lid') return user + '@s.whatsapp.net';
    return user + '@' + server;
};

const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├  ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

module.exports = async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;
        if (m.mtype !== 'groupStatusMentionMessage') return;

        const groupSettings = await getGroupSettings(m.chat);
        const mode = (groupSettings.antistatusmention || "off").toLowerCase();

        if (!mode || mode === "off" || mode === "false") return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        if (isAdmin) {
            await client.sendMessage(m.chat, {
                text: fmt(`Admin @${m.sender.split("@")[0]} dropped a status mention.\nAdmins get a pass — but keep it minimal. 😒`),
                mentions: [m.sender],
            });
            return;
        }

        if (!isBotAdmin) {
            await client.sendMessage(m.chat, {
                text: fmt(`@${m.sender.split("@")[0]} sent a status mention.\nMake me admin so I can actually do something about it. 😤`),
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

        const sender = normalizeJid(m.sender);
        const username = sender.split('@')[0];

        if (mode === "kick") {
            try {
                await client.groupParticipantsUpdate(m.chat, [sender], "remove");
                await client.sendMessage(m.chat, {
                    text: fmt(`🚫 @${username} KICKED for status mention.\nMessage deleted. Rules aren't optional. 😈`),
                    mentions: [sender],
                });
            } catch {
                await client.sendMessage(m.chat, {
                    text: fmt(`Tried to kick @${username} for status mention but failed.\nCheck my permissions. 😠`),
                    mentions: [sender],
                });
            }
            return;
        }

        if (mode === "warn" || mode === "delete" || mode === "true") {
            const MAX_WARNS = await getWarnLimit(m.chat);
            const newCount = await incrementWarn(m.chat, sender);
            const remaining = MAX_WARNS - newCount;

            if (newCount >= MAX_WARNS) {
                await resetWarn(m.chat, sender);
                await client.groupParticipantsUpdate(m.chat, [sender], "remove");
                await client.sendMessage(m.chat, {
                    text: fmt(`🚨 @${username} KICKED!\n├ Reason: Status mention spam\n├ Warns: ${newCount}/${MAX_WARNS}\n├ That's your limit. Get out. 😈`),
                    mentions: [sender],
                });
                return;
            }

            await client.sendMessage(m.chat, {
                text: fmt(`⚠️ @${username}, warned for status mention!\n├ Message deleted.\n├ Warns: ${newCount}/${MAX_WARNS}\n├ ${remaining} more and you're GONE. 😈`),
                mentions: [sender],
            });
        }
    } catch (err) {
        console.error("AntiStatusMention Error:", err);
    }
};
