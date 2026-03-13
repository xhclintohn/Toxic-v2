const { getGroupSettings } = require("../database/config");

const formatStylishReply = (message) => {
    return `╭───(    TOXIC-MD    )───\n├  ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

module.exports = async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;

        const groupSettings = await getGroupSettings(m.chat);
        const mode = groupSettings.antistatusmention;

        if (!mode || mode === "off" || mode === "false") return;

        if (m.mtype !== 'groupStatusMentionMessage') return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        if (isAdmin) {
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Admin Status Mention Detected\nUser: @${m.sender.split("@")[0]}\nAdmins get a free pass for status mentions\nBut seriously, keep it minimal! 😒`),
                mentions: [m.sender],
            });
            return;
        }

        if (!isBotAdmin) {
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Can't Delete Status Mention! 😤\nUser: @${m.sender.split("@")[0]} just dropped a status mention\nBut I'm not admin here! How embarrassing...\nAdmins: Make me admin so I can delete this nonsense!`),
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
                text: formatStylishReply(`Status Mention Deleted! 🗑️\nUser: @${m.sender.split("@")[0]} thought they could spam\nStatus mentions are NOT allowed here!\nNext violation = Immediate removal! ⚠️`),
                mentions: [m.sender],
            });
        }

        if (mode === "remove") {
            try {
                await client.groupParticipantsUpdate(m.chat, [m.sender], "remove");
                await client.sendMessage(m.chat, {
                    text: formatStylishReply(`User Removed for Status Mention! 🚫\n@${m.sender.split("@")[0]} ignored the warnings\nNo status mentions allowed in this group!\nLearn the rules or stay out! 😤`),
                    mentions: [m.sender],
                });
            } catch {
                await client.sendMessage(m.chat, {
                    text: formatStylishReply(`Failed to Remove User! 😠\nTried to kick @${m.sender.split("@")[0]} for status mention\nBut I don't have enough permissions!\nAdmins: Fix my permissions!`),
                    mentions: [m.sender],
                });
            }
        }
    } catch (err) {}
};
