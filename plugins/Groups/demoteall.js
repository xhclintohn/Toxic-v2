const middleware = require('../../utils/botUtil/middleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

const BOX = (title, lines) => {
    const body = (Array.isArray(lines) ? lines : [lines]).map(l => `├ ${l}`).join('\n');
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

module.exports = {
    name: 'demoteall',
    aliases: ['dall'],
    description: 'Demotes all admins to regular members (keeps superadmins)',
    run: async (context) => {
        await middleware(context, async () => {
            const { client, m, isBotAdmin } = context;
            const fq = getFakeQuoted(m);

            if (!m.isGroup) return client.sendMessage(m.chat, { text: BOX('ERROR', ['Group only command.']) }, { quoted: fq });
            if (!isBotAdmin) return client.sendMessage(m.chat, { text: BOX('ERROR', ['Make me admin first.']) }, { quoted: fq });

            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            try {
                const meta = await client.groupMetadata(m.chat);
                const botJid = client.user?.id ? client.user.id.split(':')[0] + '@s.whatsapp.net' : '';
                const demotable = meta.participants.filter(p => {
                    const jid = (p.jid || p.id || '').split(':')[0].replace(/\D(?=\d{10})/, '') + '@s.whatsapp.net';
                    return p.admin === 'admin' && jid !== botJid;
                });
                const jids = demotable.map(p => (p.jid || p.id).split(':')[0].replace(/\D(?=\d{10})/, '') + '@s.whatsapp.net').filter(Boolean);

                if (!jids.length) return client.sendMessage(m.chat, { text: BOX('DEMOTEALL', ['No admins to demote (other than me).']) }, { quoted: fq });

                await client.sendMessage(m.chat, { text: BOX('DEMOTEALL', [`Demoting ${jids.length} admin(s)...`]) }, { quoted: fq });

                const batchSize = 5;
                let demoted = 0;
                for (let i = 0; i < jids.length; i += batchSize) {
                    const batch = jids.slice(i, i + batchSize);
                    try { await client.groupParticipantsUpdate(m.chat, batch, 'demote'); demoted += batch.length; } catch {}
                    if (i + batchSize < jids.length) await new Promise(r => setTimeout(r, 1500));
                }

                await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
                await client.sendMessage(m.chat, {
                    text: BOX('DEMOTEALL', [`Done. ${demoted} admin(s) stripped of power.`, `Nobody special anymore. Back to being regular.`])
                }, { quoted: fq });
            } catch (err) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                await client.sendMessage(m.chat, { text: BOX('ERROR', [`Failed: ${err.message?.slice(0, 60)}`]) }, { quoted: fq });
            }
        });
    }
};
