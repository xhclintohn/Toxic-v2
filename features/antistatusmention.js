import { getGroupSettings, addWarn, resetWarn, getWarnLimit } from '../database/config.js';
import { resolveTargetJid } from '../lib/lidResolver.js';

const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├  ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

export default async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;
        if (m.mtype !== 'groupStatusMentionMessage') return;

        const groupSettings = await getGroupSettings(m.chat);
        const mode = (groupSettings.antistatusmention || 'off').toLowerCase();
        if (!mode || mode === 'off' || mode === 'false') return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        // Resolve real phone JID — same pattern as warn.js plugin
        const groupMetadata = await client.groupMetadata(m.chat);
        const sender = resolveTargetJid(m.sender, groupMetadata.participants);
        if (!sender) return;
        const username = sender.split('@')[0];

        if (isAdmin) {
            await client.sendMessage(m.chat, {
                text: fmt(`Admin @${username} dropped a status mention.\nAdmins get a pass — but keep it minimal. 😒`),
                mentions: [sender],
            });
            return;
        }

        if (!isBotAdmin) {
            await client.sendMessage(m.chat, {
                text: fmt(`@${username} sent a status mention.\nMake me admin so I can actually do something about it. 😤`),
                mentions: [sender],
            });
            return;
        }

        // Delete using original key — WhatsApp resolves LID participant internally
        try {
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || m.sender,
                },
            });
        } catch {}

        if (mode === 'kick') {
            try {
                await client.groupParticipantsUpdate(m.chat, [sender], 'remove');
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

        if (mode === 'warn' || mode === 'delete' || mode === 'true') {
            const MAX_WARNS = await getWarnLimit(m.chat);
            const newCount = await addWarn(m.chat, username);
            const remaining = MAX_WARNS - newCount;

            if (newCount >= MAX_WARNS) {
                await resetWarn(m.chat, username);
                try { await client.groupParticipantsUpdate(m.chat, [sender], 'remove'); } catch {}
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
        console.error('AntiStatusMention Error:', err);
    }
};
