const middleware = require('../../utils/botUtil/middleware');

const BOX = (title, lines) => {
    const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

module.exports = {
    name: 'promoteall',
    aliases: ['pall'],
    description: 'Promotes all non-admin members to admin',
    run: async (context) => {
        await middleware(context, async () => {
            const { client, m, isBotAdmin } = context;

            if (!m.isGroup) return client.sendMessage(m.chat, { text: BOX('ERROR', ['Group only command.']) }, { quoted: m });
            if (!isBotAdmin) return client.sendMessage(m.chat, { text: BOX('ERROR', ['Make me admin first.']) }, { quoted: m });

            try {
                const meta = await client.groupMetadata(m.chat);
                const nonAdmins = meta.participants.filter(p => p.admin !== 'admin' && p.admin !== 'superadmin');
                const jids = nonAdmins.map(p => (p.jid || p.id).split(':')[0].replace(/\D(?=\d{10})/, '') + '@s.whatsapp.net').filter(Boolean);

                if (!jids.length) return client.sendMessage(m.chat, { text: BOX('PROMOTEALL', ['Everyone\'s already an admin. Nothing to do.']) }, { quoted: m });

                await client.sendMessage(m.chat, { text: BOX('PROMOTEALL', [`Promoting ${jids.length} members...`]) }, { quoted: m });

                const batchSize = 5;
                let promoted = 0;
                for (let i = 0; i < jids.length; i += batchSize) {
                    const batch = jids.slice(i, i + batchSize);
                    try { await client.groupParticipantsUpdate(m.chat, batch, 'promote'); promoted += batch.length; } catch {}
                    if (i + batchSize < jids.length) await new Promise(r => setTimeout(r, 1500));
                }

                await client.sendMessage(m.chat, {
                    text: BOX('PROMOTEALL', [`Done. ${promoted} member(s) promoted to admin.`, `You made everyone a boss. Congrats on the chaos.`])
                }, { quoted: m });
            } catch (err) {
                await client.sendMessage(m.chat, { text: BOX('ERROR', [`Failed: ${err.message?.slice(0, 60)}`]) }, { quoted: m });
            }
        });
    }
};
