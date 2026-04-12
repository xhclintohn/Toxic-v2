const { getFakeQuoted } = require('../../lib/fakeQuoted');
module.exports = {
    name: 'listonline',
    alias: ['online', 'active', 'onlineusers', 'whoonline'],
    description: 'List currently online group members',
    run: async (context) => {
        const { client, m } = context;
        const fq = getFakeQuoted(m);
        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ Group only, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const groupMeta = await client.groupMetadata(m.chat);
            const participants = groupMeta.participants || [];
            const groupName = groupMeta.subject || 'Group';

            const participantJids = new Set();
            for (const p of participants) {
                const jid = (p.id || '').split(':')[0];
                if (jid) participantJids.add(jid);
            }

            const presenceMap = {};

            const presenceHandler = ({ presences }) => {
                for (const [jid, data] of Object.entries(presences || {})) {
                    const status = data?.lastKnownPresence;
                    if (!['available', 'composing', 'recording'].includes(status)) continue;
                    const bare = jid.split(':')[0];
                    if (participantJids.has(bare)) {
                        presenceMap[bare] = status;
                    }
                }
            };

            client.ev.on('presence.update', presenceHandler);

            try { await client.presenceSubscribe(m.chat); } catch {}

            for (const p of participants) {
                const jid = (p.id || '').split(':')[0];
                if (jid) { try { await client.presenceSubscribe(jid); } catch {} }
            }

            await new Promise(res => setTimeout(res, 6000));
            client.ev.off('presence.update', presenceHandler);

            const onlineJids = Object.keys(presenceMap);

            await client.sendMessage(m.chat, { react: { text: onlineJids.length ? '✅' : '❌', key: m.key } });

            if (!onlineJids.length) {
                return client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ NOBODY HOME ≪───\n├ Group: ${groupName}\n├ All ${participants.length} members hiding.\n├ Cowards. 💀\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: fq });
            }

            const list = onlineJids.map((j, i) => `├ ${i + 1}. @${j.split('@')[0]}`).join('\n');
            const mentions = onlineJids.map(j => j.includes('@') ? j : j + '@s.whatsapp.net');

            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ ONLINE MEMBERS ≪───\n├ Group: ${groupName}\n├ Online: ${onlineJids.length}/${participants.length}\n├ \n${list}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions
            }, { quoted: fq });

        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├ Failed to fetch online members.\n├ ${err.message || 'Unknown error'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
