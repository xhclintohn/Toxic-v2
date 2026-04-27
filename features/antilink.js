import { getGroupSettings, addWarn, resetWarn, getWarnLimit } from '../database/config.js';
import { resolveTargetJid } from '../lib/lidResolver.js';

const DEV_NUMBER = '254114885159';

const _num = (jid) => (jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

// Participants can have LID in id — use phoneNumber field first for the real phone number
const _pNum = (p) => {
    const phone = p.phoneNumber || p.phone_number || '';
    if (phone) return _num(phone);
    const base = p.id || p.jid || '';
    if (base && !base.endsWith('@lid')) return _num(base);
    return _num(p.lid || base);
};

const isDevJid = (jid) => _num(jid) === DEV_NUMBER;

export default async (client, m) => {
    try {
        if (!m || !m.chat || !m.chat.endsWith('@g.us')) return;
        if (m.key?.fromMe) return;
        if (isDevJid(m.sender)) return;

        const groupSettings = await getGroupSettings(m.chat);
        const antilinkMode = (groupSettings.antilink || 'off').toLowerCase();
        if (antilinkMode === 'off') return;

        const msg = m.message || {};
        const innerMsg = msg.extendedTextMessage || msg.imageMessage || msg.videoMessage ||
            msg.documentMessage || msg.audioMessage || msg.stickerMessage || null;
        const contextInfo = (typeof innerMsg === 'object' && innerMsg?.contextInfo) || msg.contextInfo || null;
        const isForwarded = contextInfo?.isForwarded === true;
        const forwardingScore = contextInfo?.forwardingScore || 0;
        const originJid = contextInfo?.remoteJid || '';
        const isChannelForward = isForwarded && (forwardingScore >= 1 || originJid.endsWith('@newsletter'));

        const text = (m.text || msg.conversation || msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption || msg.videoMessage?.caption ||
            msg.documentMessage?.caption || '').toLowerCase();
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,6}(\/[^\s]*)?)/gi;
        const hasPreview = msg.extendedTextMessage?.matchedText || msg.extendedTextMessage?.canonicalUrl;
        const hasLink = urlRegex.test(text) || !!hasPreview;

        if (!isChannelForward && !hasLink) return;

        // Resolve real JID from group metadata — same pattern as warn.js
        const groupMetadata = await client.groupMetadata(m.chat);
        const sender = resolveTargetJid(m.sender, groupMetadata.participants);

        console.log(`[ANTILINK] chat=${m.chat} rawSender=${m.sender} resolved=${sender} mode=${antilinkMode} hasLink=${hasLink} isChannelFwd=${isChannelForward}`);

        if (!sender) {
            console.log('[ANTILINK] Could not resolve sender — skipping action.');
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

        console.log(`[ANTILINK] senderNum=${senderNum} isAdmin=${isAdmin} isBotAdmin=${isBotAdmin}`);

        if (isAdmin) { console.log('[ANTILINK] Sender is admin — skipping.'); return; }
        if (!isBotAdmin) { console.log('[ANTILINK] Bot is not admin — skipping.'); return; }

        const reason = isChannelForward ? '📡 Channel forward' : '🔗 Link detected';

        // Delete using original key — WhatsApp handles LID participant internally
        try {
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || m.sender
                }
            });
        } catch (e) {
            console.log('[ANTILINK] Delete failed:', e.message);
        }

        const username = senderNum || sender.split('@')[0];

        // KICK mode: instantly remove without warning
        if (antilinkMode === 'kick') {
            try {
                await client.groupParticipantsUpdate(m.chat, [sender], 'remove');
                await client.sendMessage(m.chat, {
                    text: `╭───( *Toxic-MD Antilink* )───\n├ 🚨 @${username} KICKED!\n├ Reason: ${reason}\n├ Kick mode — zero tolerance. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                    mentions: [sender]
                });
            } catch (e) {
                console.log('[ANTILINK] Kick failed:', e.message);
            }
            return;
        }

        // WARN mode: warn then kick at limit
        const MAX_WARNS = await getWarnLimit(m.chat);
        const newCount = await addWarn(m.chat, username);
        const remaining = MAX_WARNS - newCount;

        if (newCount >= MAX_WARNS) {
            await resetWarn(m.chat, username);
            try { await client.groupParticipantsUpdate(m.chat, [sender], 'remove'); } catch {}
            await client.sendMessage(m.chat, {
                text: `╭───( *Toxic-MD Antilink* )───\n├ 🚨 @${username} KICKED!\n├ Reason: ${reason}\n├ Warns: ${newCount}/${MAX_WARNS}\n├ That's it. Get out. 😈\n├ Warn count wiped clean.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [sender]
            });
            return;
        }

        await client.sendMessage(m.chat, {
            text: `╭───( *Toxic-MD Antilink* )───\n├ ⚠️ @${username}, warned!\n├ Reason: ${reason}\n├ Message deleted.\n├ Warns: ${newCount}/${MAX_WARNS}\n├ ${remaining} more and you're GONE. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            mentions: [sender]
        });
    } catch (err) {
        console.error('[ANTILINK] Error:', err.message);
    }
};
