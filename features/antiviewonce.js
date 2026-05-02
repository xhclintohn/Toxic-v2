import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { getCachedSettings } from '../lib/settingsCache.js';

function _unwrap(msg) {
    if (!msg) return msg;
    if (msg.ephemeralMessage?.message) return _unwrap(msg.ephemeralMessage.message);
    if (msg.viewOnceMessage?.message) return _unwrap(msg.viewOnceMessage.message);
    if (msg.viewOnceMessageV2?.message) return _unwrap(msg.viewOnceMessageV2.message);
    if (msg.viewOnceMessageV2Extension?.message) return _unwrap(msg.viewOnceMessageV2Extension.message);
    return msg;
}

function isViewOnce(rawMessage) {
    if (!rawMessage) return false;
    if (rawMessage.viewOnceMessage || rawMessage.viewOnceMessageV2 || rawMessage.viewOnceMessageV2Extension) return true;
    const inner = _unwrap(rawMessage);
    if (inner?.imageMessage?.viewOnce === true) return true;
    if (inner?.videoMessage?.viewOnce === true) return true;
    return false;
}

function getViewOnceMedia(rawMessage) {
    const voWrapper = rawMessage.viewOnceMessage || rawMessage.viewOnceMessageV2 || rawMessage.viewOnceMessageV2Extension;
    if (voWrapper) {
        const inner = voWrapper.message || voWrapper;
        return { image: inner.imageMessage || null, video: inner.videoMessage || null };
    }
    const inner = _unwrap(rawMessage);
    return {
        image: inner?.imageMessage?.viewOnce ? inner.imageMessage : null,
        video: inner?.videoMessage?.viewOnce ? inner.videoMessage : null
    };
}

async function downloadMedia(client, message, type) {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    } catch {
        return await client.downloadMediaMessage(message);
    }
}

export default async (client, m) => {
    try {
        if (!m?.message || m.key?.fromMe) return;

        const rawMessage = m.message;
        if (!isViewOnce(rawMessage)) return;

        const settings = await getCachedSettings();
        if (!settings?.antiviewonce) return;

        let dest = client.user?.id || '';
        if (dest.includes(':')) dest = dest.split(':')[0] + '@s.whatsapp.net';
        if (!dest) return;

        const media = getViewOnceMedia(rawMessage);
        if (!media.image && !media.video) return;

        const senderNum = (m.sender || m.key?.participant || m.key?.remoteJid || '').split('@')[0].split(':')[0] || 'Unknown';
        const chatType = (m.chat || m.key?.remoteJid || '').endsWith('@g.us') ? 'Group' : 'DM';
        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE RETRIEVED ≪───\n├ \n├ 👁 Sender: @${senderNum}\n├ 📍 Chat: ${chatType}\n├ \n├ You sneaky little thing. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        const mentions = m.sender ? [m.sender] : [];

        if (media.image) {
            const buffer = await downloadMedia(client, media.image, 'image');
            if (buffer?.length > 0) await client.sendMessage(dest, { image: buffer, caption, mentions });
        } else if (media.video) {
            const buffer = await downloadMedia(client, media.video, 'video');
            if (buffer?.length > 0) await client.sendMessage(dest, { video: buffer, caption, mentions });
        }
    } catch (e) {
        console.log('❌ [ANTIVIEWONCE]:', e.message);
    }
};
