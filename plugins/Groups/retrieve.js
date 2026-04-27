import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    const { client, m } = context;
    const fq = getFakeQuoted(m);
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    if (!m.quoted) {
        return await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ RETRIEVE ≪───\n├ \n├ Reply to a view-once message, genius. 🙄\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
    }

    try {
        const ctx = m.msg?.contextInfo || m.message?.extendedTextMessage?.contextInfo || {};
        const quotedMsg = ctx.quotedMessage || {};

        const unwrap = (msg) => {
            if (!msg) return null;
            const voKeys = ['viewOnceMessageV2Extension', 'viewOnceMessageV2', 'viewOnceMessage'];
            for (const k of voKeys) {
                if (msg[k]?.message) return msg[k].message;
            }
            return msg;
        };

        const inner = unwrap(quotedMsg);
        if (!inner) {
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ RETRIEVE ≪───\n├ \n├ That's not a view-once. Stop wasting my time. 😒\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }

        const imageMsg = inner.imageMessage || null;
        const videoMsg = inner.videoMessage || null;

        if (!imageMsg && !videoMsg) {
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ RETRIEVE ≪───\n├ \n├ That's not a view-once. Stop wasting my time. 😒\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }

        const mediaMsg = imageMsg || videoMsg;
        const buffer = await client.downloadMediaMessage(mediaMsg);

        if (!buffer || buffer.length === 0) {
            return await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ RETRIEVE ≪───\n├ \n├ Couldn't download it. WhatsApp already nuked it. 😤\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }

        const botDm = client.user?.id;
        const senderNum = (m.quoted?.sender || ctx.participant || '').split('@')[0].split(':')[0] || 'Unknown';
        const caption = `╭───(    TOXIC-MD    )───\n├───≫ VIEW ONCE RETRIEVED ≪───\n├ \n├ 👁 Sender: @${senderNum}\n├ 📍 Chat: ${m.isGroup ? 'Group' : 'DM'}\n├ \n├ You sneaky little thing. 😈\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
        const mentions = ctx.participant ? [ctx.participant] : [];
        const dest = botDm || m.chat;

        if (imageMsg) {
            await client.sendMessage(dest, { image: buffer, caption, mentions });
        } else {
            await client.sendMessage(dest, { video: buffer, caption, mentions });
        }
    } catch (e) {
        await client.sendMessage(m.chat, {
            text: `╭───(    TOXIC-MD    )───\n├───≫ RETRIEVE ≪───\n├ \n├ Something broke. WhatsApp's fault, not mine. 😤\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
    }
};
