module.exports = {
    name: 'listonline',
    alias: ['online', 'active', 'onlineusers', 'whoonline'],
    description: 'List currently online group members',
    run: async (context) => {
        const { client, m } = context;
        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ Group only, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const stripDevice = (jid) => jid ? jid.split(':')[0] : '';

        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const groupMeta = await client.groupMetadata(m.chat);
            const participants = groupMeta.participants || [];
            const groupName = groupMeta.subject || 'Group';

            const participantSet = new Set(
                participants.map(p => stripDevice(p.id || p.jid || '')).filter(Boolean)
            );

            const presenceMap = {};

            const presenceHandler = ({ id, presences }) => {
                if (id !== m.chat) return;
                for (const [jid, data] of Object.entries(presences || {})) {
                    const status = data?.lastKnownPresence;
                    if (['available', 'composing', 'recording'].includes(status)) {
                        presenceMap[stripDevice(jid)] = status;
                    }
                }
            };

            client.ev.on('presence.update', presenceHandler);
            try { await client.presenceSubscribe(m.chat); } catch {}

            for (const p of participants) {
                const pjid = stripDevice(p.id || p.jid || '');
                if (pjid) { try { await client.presenceSubscribe(pjid); } catch {} }
            }

            await new Promise(res => setTimeout(res, 5000));
            client.ev.off('presence.update', presenceHandler);

            const onlineJids = Object.keys(presenceMap).filter(j => participantSet.has(j));

            await client.sendMessage(m.chat, { react: { text: onlineJids.length ? '✅' : '❌', key: m.key } });

            if (!onlineJids.length) {
                return client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ NOBODY HOME ≪───\n├ Group: ${groupName}\n├ All ${participants.length} members hiding.\n├ Cowards. 💀\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: m });
            }

            const mentionJids = onlineJids.map(j => {
                if (j.endsWith('@lid')) return j;
                const num = j.split('@')[0].replace(/\D/g, '');
                return num + '@s.whatsapp.net';
            });

            const list = mentionJids.map((j, i) => `├ ${i + 1}. @${j.split('@')[0]}`).join('\n');

            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ ONLINE MEMBERS ≪───\n├ Group: ${groupName}\n├ Online: ${onlineJids.length}/${participants.length}\n├ \n${list}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: mentionJids
            }, { quoted: m });

        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├ Failed to fetch online members.\n├ ${err.message || 'Unknown error'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
