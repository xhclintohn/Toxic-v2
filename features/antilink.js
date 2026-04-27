import { getGroupSettings, addWarn, resetWarn, getWarnLimit } from '../database/config.js';
import { resolveTargetJid } from '../lib/lidResolver.js';

const DEV_NUMBER = '254114885159';

const isDevJid = (jid) => {
    if (!jid) return false;
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') === DEV_NUMBER;
};

export default async (client, m) => {
    try {
        if (!m || !m.chat || !m.chat.endsWith('@g.us')) return;
        if (m.key?.fromMe) return;
        if (isDevJid(m.sender)) return;

        const groupSettings = await getGroupSettings(m.chat);
        const antilinkMode = (groupSettings.antilink || 'off').toLowerCase();
        if (antilinkMode === 'off') return;

        const isAdmin = m.isAdmin === true;
        const isBotAdmin = m.isBotAdmin === true;
        if (isAdmin || !isBotAdmin) return;

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

        // Delete using original key — WhatsApp resolves LID participant internally
        try {
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.key.participant || m.sender
                }
            });
        } catch {}

        const reason = isChannelForward ? '📡 Channel forward' : '🔗 Link detected';

        // Resolve real phone JID — same pattern as warn.js plugin
        const groupMetadata = await client.groupMetadata(m.chat);
        const sender = resolveTargetJid(m.sender, groupMetadata.participants);
        if (!sender) return;
        const username = sender.split('@')[0];

        // KICK mode: instantly remove without warning
        if (antilinkMode === 'kick') {
            try {
                await client.groupParticipantsUpdate(m.chat, [sender], 'remove');
                await client.sendMessage(m.chat, {
                    text: `╭───( *Toxic-MD Antilink* )───\n├ 🚨 @${username} KICKED!\n├ Reason: ${reason}\n├ Kick mode — zero tolerance. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                    mentions: [sender]
                });
            } catch {}
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
        console.error('Antilink Error:', err);
    }
};
