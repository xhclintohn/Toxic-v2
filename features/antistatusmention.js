import { getGroupSettings, addWarn, resetWarn, getWarnLimit } from '../database/config.js';
import { resolveTargetJid } from '../lib/lidResolver.js';

const fmt = (msg) => `╭───(    TOXIC-MD    )───\n├  ${msg}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

const _num = (jid) => (jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

// Participants can have LID in id — use phoneNumber field first for the real phone number
const _pNum = (p) => {
    const phone = p.phoneNumber || p.phone_number || '';
    if (phone) return _num(phone);
    const base = p.id || p.jid || '';
    if (base && !base.endsWith('@lid')) return _num(base);
    return _num(p.lid || base); // fallback: LID number (not a phone, but best we have)
};

export default async (client, m) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;
        if (m.mtype !== 'groupStatusMentionMessage') return;

        const groupSettings = await getGroupSettings(m.chat);
        const mode = (groupSettings.antistatusmention || 'off').toLowerCase();
        if (!mode || mode === 'off' || mode === 'false') return;

        // Fetch fresh metadata and resolve sender via resolveTargetJid (same as warn.js)
        const groupMetadata = await client.groupMetadata(m.chat);
        const sender = resolveTargetJid(m.sender, groupMetadata.participants);

        console.log(`[ANTISTATUSMENTION] chat=${m.chat} rawSender=${m.sender} resolved=${sender} fromMe=${m.key.fromMe} mtype=${m.mtype}`);

        if (!sender) {
            console.log('[ANTISTATUSMENTION] Could not resolve sender — skipping.');
            return;
        }

        const senderNum = _num(sender);
        const botRaw = client.decodeJid ? client.decodeJid(client.user.id) : (client.user?.id || '');
        const botNum = _num(botRaw);

        // Re-derive admin status using _pNum (checks phoneNumber first, then non-LID id)
        const isAdmin = groupMetadata.participants.some(p => {
            return _pNum(p) === senderNum && (p.admin === 'admin' || p.admin === 'superadmin');
        });
        const isBotAdmin = groupMetadata.participants.some(p => {
            return _pNum(p) === botNum && (p.admin === 'admin' || p.admin === 'superadmin');
        });

        console.log(`[ANTISTATUSMENTION] senderNum=${senderNum} isAdmin=${isAdmin} isBotAdmin=${isBotAdmin} mode=${mode}`);

        const username = senderNum || sender.split('@')[0];

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

        // Delete using original key — WhatsApp handles LID participant internally
        try {
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || m.sender,
                },
            });
        } catch (e) {
            console.log('[ANTISTATUSMENTION] Delete failed:', e.message);
        }

        if (mode === 'kick') {
            try {
                await client.groupParticipantsUpdate(m.chat, [sender], 'remove');
                await client.sendMessage(m.chat, {
                    text: fmt(`🚫 @${username} KICKED for status mention.\nMessage deleted. Rules aren't optional. 😈`),
                    mentions: [sender],
                });
            } catch (e) {
                console.log('[ANTISTATUSMENTION] Kick failed:', e.message);
                await client.sendMessage(m.chat, {
                    text: fmt(`Tried to kick @${username} for status mention but failed.\nCheck my permissions. 😠`),
                    mentions: [sender],
                });
            }
            return;
        }

        // warn / delete / true — warn then kick at limit
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
    } catch (err) {
        console.error('[ANTISTATUSMENTION] Error:', err.message);
    }
};
