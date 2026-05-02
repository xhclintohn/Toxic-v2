import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { getCachedSettings } from '../lib/settingsCache.js';

const VIEW_ONCE_MTYPES = new Set(['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension']);

function detectViewOnce(m) {
    if (!m?.message) return false;
    if (VIEW_ONCE_MTYPES.has(m.mtype)) return true;
    const keys = Object.keys(m.message);
    if (keys.some(k => VIEW_ONCE_MTYPES.has(k))) return true;
    if (m.msg?.viewOnce === true) return true;
    if (m.msg?.imageMessage?.viewOnce === true) return true;
    if (m.msg?.videoMessage?.viewOnce === true) return true;
    return false;
}

function extractMedia(m) {
    if (m.mtype === 'viewOnceMessage') {
        const voInner = m.message?.viewOnceMessage?.message || {};
        const innerType = Object.keys(voInner).find(k => k !== 'messageContextInfo') || '';
        if (innerType === 'imageMessage') return { image: m.msg, video: null };
        if (innerType === 'videoMessage') return { image: null, video: m.msg };
    }

    if (m.mtype === 'viewOnceMessageV2' || m.mtype === 'viewOnceMessageV2Extension') {
        const inner = m.msg?.message || {};
        return { image: inner.imageMessage || null, video: inner.videoMessage || null };
    }

    const rawKeys = Object.keys(m.message || {});
    for (const k of rawKeys) {
        if (!VIEW_ONCE_MTYPES.has(k)) continue;
        const wrapper = m.message[k];
        const inner = wrapper?.message || wrapper || {};
        const imageMsg = inner.imageMessage || null;
        const videoMsg = inner.videoMessage || null;
        if (imageMsg || videoMsg) return { image: imageMsg, video: videoMsg };
    }

    if (m.msg?.viewOnce === true) {
        const mime = m.msg?.mimetype || '';
        if (mime.startsWith('video')) return { image: null, video: m.msg };
        return { image: m.msg, video: null };
    }

    return { image: null, video: null };
}

async function downloadMedia(client, mediaMsg, type) {
    try {
        const stream = await downloadContentFromMessage(mediaMsg, type);
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        if (buf.length > 0) return buf;
        console.log('[ANTIVIEWONCE] stream returned empty buffer');
    } catch (e) {
        console.log('[ANTIVIEWONCE] stream download error:', e.message);
    }
    try {
        const buf = await client.downloadMediaMessage(mediaMsg);
        if (buf?.length > 0) return buf;
        console.log('[ANTIVIEWONCE] fallback returned empty buffer');
    } catch (e) {
        console.log('[ANTIVIEWONCE] fallback download error:', e.message);
    }
    return null;
}

export default async (client, m) => {
    try {
        console.log('[AVO] called | mtype:', m?.mtype, '| fromMe:', m?.key?.fromMe);

        if (!m?.message || m.key?.fromMe) return;

        if (!detectViewOnce(m)) {
            const msgKeys = Object.keys(m.message || {});
            console.log('[AVO] not view-once | mtype:', m.mtype, '| msg keys:', msgKeys.join(','));
            return;
        }

        console.log('[AVO] view-once detected | mtype:', m.mtype, '| chat:', m.chat, '| sender:', m.sender);

        const settings = await getCachedSettings();
        console.log('[AVO] antiviewonce enabled:', settings?.antiviewonce);
        if (!settings?.antiviewonce) return;

        let dest = client.user?.id || '';
        if (dest.includes(':')) dest = dest.split(':')[0] + '@s.whatsapp.net';
        if (!dest) dest = client.decodeJid ? client.decodeJid(client.user.id) : client.user.id;
        if (!dest) { console.log('[AVO] could not resolve dest JID'); return; }

        const { image: imageMsg, video: videoMsg } = extractMedia(m);
        console.log('[AVO] image:', !!imageMsg, '| video:', !!videoMsg, '| dest:', dest);

        if (!imageMsg && !videoMsg) {
            console.log('[AVO] no media extracted | m.msg keys:', Object.keys(m.msg || {}));
            return;
        }

        const senderNum = (m.sender || m.key?.participant || m.key?.remoteJid || '').split('@')[0].split(':')[0] || 'Unknown';
        const chatType = (m.chat || m.key?.remoteJid || '').endsWith('@g.us') ? 'Group' : 'DM';
        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE RETRIEVED ≪───\n├ \n├ 👁 Sender: @${senderNum}\n├ 📍 Chat: ${chatType}\n├ \n├ You sneaky little thing. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        const mentions = m.sender ? [m.sender] : [];

        if (imageMsg) {
            console.log('[AVO] downloading image...');
            const buf = await downloadMedia(client, imageMsg, 'image');
            console.log('[AVO] image buf size:', buf?.length ?? 0);
            if (buf?.length > 0) {
                await client.sendMessage(dest, { image: buf, caption, mentions });
                console.log('[AVO] ✅ image sent to', dest);
            }
        } else if (videoMsg) {
            console.log('[AVO] downloading video...');
            const buf = await downloadMedia(client, videoMsg, 'video');
            console.log('[AVO] video buf size:', buf?.length ?? 0);
            if (buf?.length > 0) {
                await client.sendMessage(dest, { video: buf, caption, mentions });
                console.log('[AVO] ✅ video sent to', dest);
            }
        }
    } catch (e) {
        console.log('[AVO] ❌ ERROR:', e.message, e.stack?.split('\n')[1] || '');
    }
};
