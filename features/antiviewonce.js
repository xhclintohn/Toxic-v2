import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { getCachedSettings } from '../lib/settingsCache.js';

const VIEW_ONCE_TYPES = new Set(['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension']);

function extractMedia(m) {
    if (m.mtype === 'viewOnceMessage') {
        const voInner = m.message?.viewOnceMessage?.message || {};
        const innerType = Object.keys(voInner).find(k => k !== 'messageContextInfo') || '';
        return {
            image: innerType === 'imageMessage' ? m.msg : null,
            video: innerType === 'videoMessage' ? m.msg : null
        };
    }
    const inner = m.msg?.message || {};
    return {
        image: inner.imageMessage || null,
        video: inner.videoMessage || null
    };
}

async function downloadMedia(client, mediaMsg, type) {
    try {
        const stream = await downloadContentFromMessage(mediaMsg, type);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        if (buf.length > 0) return buf;
    } catch (e) {
        console.log('[ANTIVIEWONCE] stream download failed:', e.message);
    }
    try {
        const buf = await client.downloadMediaMessage(mediaMsg);
        if (buf?.length > 0) return buf;
    } catch (e) {
        console.log('[ANTIVIEWONCE] fallback download failed:', e.message);
    }
    return null;
}

export default async (client, m) => {
    try {
        if (!m?.message || m.key?.fromMe) return;
        if (!VIEW_ONCE_TYPES.has(m.mtype)) return;

        console.log('[ANTIVIEWONCE] View-once detected | mtype:', m.mtype, '| chat:', m.chat, '| sender:', m.sender);

        const settings = await getCachedSettings();
        console.log('[ANTIVIEWONCE] Setting enabled:', settings?.antiviewonce);
        if (!settings?.antiviewonce) return;

        let dest = client.user?.id || '';
        if (dest.includes(':')) dest = dest.split(':')[0] + '@s.whatsapp.net';
        if (!dest) dest = client.decodeJid ? client.decodeJid(client.user.id) : client.user.id;
        if (!dest) { console.log('[ANTIVIEWONCE] Could not resolve bot DM JID'); return; }

        const { image: imageMsg, video: videoMsg } = extractMedia(m);
        console.log('[ANTIVIEWONCE] Has image:', !!imageMsg, '| Has video:', !!videoMsg);

        if (!imageMsg && !videoMsg) {
            console.log('[ANTIVIEWONCE] No media extracted — msg.msg keys:', Object.keys(m.msg || {}));
            return;
        }

        const senderNum = (m.sender || m.key?.participant || m.key?.remoteJid || '').split('@')[0].split(':')[0] || 'Unknown';
        const chatType = (m.chat || m.key?.remoteJid || '').endsWith('@g.us') ? 'Group' : 'DM';
        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE RETRIEVED ≪───\n├ \n├ 👁 Sender: @${senderNum}\n├ 📍 Chat: ${chatType}\n├ \n├ You sneaky little thing. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        const mentions = m.sender ? [m.sender] : [];

        if (imageMsg) {
            console.log('[ANTIVIEWONCE] Downloading image...');
            const buf = await downloadMedia(client, imageMsg, 'image');
            console.log('[ANTIVIEWONCE] Image buffer size:', buf?.length ?? 0);
            if (buf?.length > 0) {
                await client.sendMessage(dest, { image: buf, caption, mentions });
                console.log('[ANTIVIEWONCE] ✅ Image sent to DM:', dest);
            } else {
                console.log('[ANTIVIEWONCE] ❌ Image download returned empty buffer');
            }
        } else if (videoMsg) {
            console.log('[ANTIVIEWONCE] Downloading video...');
            const buf = await downloadMedia(client, videoMsg, 'video');
            console.log('[ANTIVIEWONCE] Video buffer size:', buf?.length ?? 0);
            if (buf?.length > 0) {
                await client.sendMessage(dest, { video: buf, caption, mentions });
                console.log('[ANTIVIEWONCE] ✅ Video sent to DM:', dest);
            } else {
                console.log('[ANTIVIEWONCE] ❌ Video download returned empty buffer');
            }
        }
    } catch (e) {
        console.log('❌ [ANTIVIEWONCE ERROR]:', e.message, e.stack?.split('\n')[1] || '');
    }
};
