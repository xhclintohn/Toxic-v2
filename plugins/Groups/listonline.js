module.exports = {
    name: 'listonline',
    alias: ['online', 'active', 'onlineusers', 'whoonline'],
    description: 'List currently online group members',
    run: async (context) => {
        const { client, m } = context;

        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ Group only, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const normalizeJid = (jid) => {
            if (!jid) return '';
            return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
        };

        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const groupMeta = await client.groupMetadata(m.chat);
            const participants = groupMeta.participants || [];
            const groupName = groupMeta.subject || 'Group';

            const participantJids = participants.map(p => normalizeJid(p.id || p.jid || '')).filter(Boolean);

            const presenceMap = {};

            const presenceHandler = ({ id, presences }) => {
                if (id !== m.chat && id !== m.chat.replace('@g.us', '@s.whatsapp.net')) return;
                for (const [jid, data] of Object.entries(presences || {})) {
                    const status = data?.lastKnownPresence;
                    if (status === 'available' || status === 'composing' || status === 'recording') {
                        presenceMap[normalizeJid(jid)] = status;
                    }
                }
            };

            client.ev.on('presence.update', presenceHandler);

            try { await client.presenceSubscribe(m.chat); } catch {}

            for (const jid of participantJids) {
                try { await client.presenceSubscribe(jid); } catch {}
            }

            await new Promise(res => setTimeout(res, 5000));
            client.ev.off('presence.update', presenceHandler);

            const onlineJids = Object.keys(presenceMap).filter(j => participantJids.includes(j));

            await client.sendMessage(m.chat, { react: { text: onlineJids.length ? '✅' : '❌', key: m.key } });

            if (!onlineJids.length) {
                return client.sendMessage(m.chat, {
                    text: `╭───(    TOXIC-MD    )───\n├───≫ NOBODY HOME ≪───\n├ Group: ${groupName}\n├ All ${participants.length} members hiding.\n├ Cowards. 💀\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                }, { quoted: m });
            }

            const list = onlineJids.map((j, i) => `├ ${i + 1}. @${j.split('@')[0]}`).join('\n');

            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ ONLINE MEMBERS ≪───\n├ Group: ${groupName}\n├ Online: ${onlineJids.length}/${participants.length}\n├ \n${list}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: onlineJids
            }, { quoted: m });

        } catch (err) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├ Failed to fetch online members.\n├ ${err.message || 'Unknown error'}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};
