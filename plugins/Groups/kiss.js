/**
 * KISS reaction — set KISS_STICKER to a raw GitHub URL to send a sticker.
 * Leave empty to use text fallback.
 */
const { getBuffer } = require('../../lib/botFunctions');

const KISS_STICKER = ''; // paste raw GitHub sticker URL here

const getTarget = (m) => {
    const jid = (m.mentionedJid && m.mentionedJid[0]) || (m.quoted && m.quoted.sender) || null;
    if (!jid) return null;
    if (!jid.includes('@s.whatsapp.net') && !jid.includes('@lid')) return null;
    return jid;
};

module.exports = {
    name: 'kiss',
    aliases: ['smooch', 'peck'],
    description: 'Kiss a tagged or quoted user',
    run: async (context) => {
        const { client, m } = context;
        try {
            const target = getTarget(m);
            if (!target) return m.reply(`╭───(    TOXIC-MD    )───\n├ Tag or quote someone to kiss.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

            const tNum = target.split('@')[0];
            const sNum = m.sender.split('@')[0];

            if (KISS_STICKER) {
                try {
                    const buf = await getBuffer(KISS_STICKER);
                    await client.sendMessage(m.chat, { sticker: buf }, { quoted: m });
                    await client.sendMessage(m.chat, {
                        text: `@${sNum} kissed @${tNum} 💋`,
                        mentions: [m.sender, target]
                    });
                    return;
                } catch {}
            }

            const lines = [
                `@${sNum} kissed @${tNum} and nobody asked. 💋`,
                `@${sNum} planted one right on @${tNum}. Bold move. 😘`,
                `@${sNum} kissed @${tNum}. The group just got awkward. 💋`,
            ];
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├ ${lines[Math.floor(Math.random() * lines.length)]}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [m.sender, target]
            }, { quoted: m });
        } catch (e) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Kiss failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
