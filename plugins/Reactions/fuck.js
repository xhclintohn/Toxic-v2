const { getBuffer } = require('../../lib/botFunctions');
const links = require('./links');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

const getTarget = (m) => {
    const jid = (m.mentionedJid && m.mentionedJid[0]) || (m.quoted && m.quoted.sender) || null;
    if (!jid) return null;
    if (!jid.includes('@s.whatsapp.net') && !jid.includes('@lid')) return null;
    return jid;
};

module.exports = {
    name: 'fuck',
    aliases: ['screw', 'bang'],
    description: 'Send a savage reaction to a tagged or quoted user',
    run: async (context) => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        try {
            const target = getTarget(m);
            if (!target) return m.reply(`╭───(    TOXIC-MD    )───\n├ Tag or quote someone first.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            const tNum = target.split('@')[0];
            const sNum = m.sender.split('@')[0];
            if (links.fuck) {
                try {
                    const buf = await getBuffer(links.fuck);
                    await client.sendMessage(m.chat, { sticker: buf }, { quoted: fq });
                    await client.sendMessage(m.chat, { text: `@${sNum} went off on @${tNum} 😤`, mentions: [m.sender, target] });
                    return;
                } catch {}
            }
            const lines = [
                `@${sNum} absolutely roasted @${tNum}. The audacity. 🔥`,
                `@${sNum} just went full savage on @${tNum}. Someone's getting blocked. 😤`,
                `@${sNum} told @${tNum} exactly what they think. No filter whatsoever. 💀`,
            ];
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├ ${lines[Math.floor(Math.random() * lines.length)]}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [m.sender, target]
            }, { quoted: fq });
        } catch {
            await m.reply(`╭───(    TOXIC-MD    )───\n├ Command failed. Try again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
