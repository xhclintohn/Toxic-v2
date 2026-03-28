module.exports = async (context) => {
    const { client, m, groupMetadata, text } = context;

    if (!m.isGroup) return client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ Command meant for groups.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });

    const normalizeJid = (jid) => {
        if (!jid) return '';
        return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
    };

    try {
        const participants = (groupMetadata?.participants || []);
        const mentions = participants.map(p => normalizeJid(p.jid || p.id)).filter(Boolean);
        const txt = [
            `╭───(    TOXIC-MD    )───`,
            `├───≫ TAG ALL ≪───`,
            `├ `,
            `├ Message: ${text ? text : 'No Message!'}`,
            `├ `,
            ...mentions.map(id => `├ @${id.split('@')[0]}`),
            `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        ].join('\n');
        await client.sendMessage(m.chat, { text: txt, mentions }, { quoted: m });
    } catch (error) {
        await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├ Failed to tag participants.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });
    }
};
