/**
 * SLAP reaction — set SLAP_STICKER to a raw GitHub URL to send a sticker.
 * Leave empty to use text fallback.
 */
const { getBuffer } = require('../../lib/botFunctions');

const SLAP_STICKER = ''; // paste raw GitHub sticker URL here

const getTarget = (m) => {
    const jid = (m.mentionedJid && m.mentionedJid[0]) || (m.quoted && m.quoted.sender) || null;
    if (!jid) return null;
    if (!jid.includes('@s.whatsapp.net') && !jid.includes('@lid')) return null;
    return jid;
};

module.exports = {
    name: 'slap',
    aliases: ['smack', 'hit'],
    description: 'Slap a tagged or quoted user',
    run: async (context) => {
        const { client, m } = context;
        try {
            const target = getTarget(m);
            if (!target) return m.reply(`╭───(    TOXIC-MD    )───\n├ Tag or quote someone to slap.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

            const tNum = target.split('@')[0];
            const sNum = m.sender.split('@')[0];

            if (SLAP_STICKER) {
                try {
                    const buf = await getBuffer(SLAP_STICKER);
                    await client.sendMessage(m.chat, { sticker: buf }, { quoted: m });
                    await client.sendMessage(m.chat, {
                        text: `@${sNum} slapped @${tNum} 💥`,
                        mentions: [m.sender, target]
                    }, { quoted: m });
                    return;
                } catch {}
            }

            const lines = [
                `@${sNum} slapped @${tNum} so hard their Wi-Fi disconnected. 💥`,
                `@${sNum} slapped @${tNum} into next week. 👋`,
                `@${sNum} gave @${tNum} a slap that echoed through the whole chat. 😤`,
            ];
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├ ${lines[Math.floor(Math.random() * lines.length)]}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [m.sender, target]
            }, { quoted: m });
        } catch (e) {
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Slap failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
