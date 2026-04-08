module.exports = {
    name: 'listonline',
    alias: ['online', 'active', 'onlineusers', 'whoonline'],
    description: 'List currently online group members',
    run: async (context) => {
        const { client, m } = context;
        if (!m.isGroup) return m.reply(`╭───(    TOXIC-MD    )───\n├ Group only, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

        const toNum = (jid) => (jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        const toServer = (jid) => ((jid || '').split('@')[1] || '').toLowerCase();
        const toPhone = (jid) => toNum(jid) + '@s.whatsapp.net';

        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

            const groupMeta = await client.groupMetadata(m.chat);
            const participants = groupMeta.participants || [];
            const groupName = groupMeta.subject || 'Group';

            const lidToPhone = {};
            const participantPhoneJids = new Set();

            for (const p of participants) {
                const rawId = p.id || '';
                const rawJid = p.jid || '';
                const idNum = toNum(rawId);
                const idServer = toServer(rawId);

                if (idServer === 'lid') {
                    const jidNum = toNum(rawJid);
                    const jidServer = toServer(rawJid);
                    if (jidNum && jidServer !== 'lid') {
                        const phoneJid = jidNum + '@s.whatsapp.net';
                        lidToPhone[idNum] = phoneJid;
                        participantPhoneJids.add(phoneJid);
                    } else {
                        const fallback = idNum + '@s.whatsapp.net';
                        lidToPhone[idNum] = fallback;
                        participantPhoneJids.add(fallback);
                    }
                } else if (idNum) {
                    participantPhoneJids.add(idNum + '@s.whatsapp.net');
                }
            }

            const presenceMap = {};

            const presenceHandler = ({ id, presences }) => {
                if (id !== m.chat) return;
                for (const [jid, data] of Object.entries(presences || {})) {
                    const status = data?.lastKnownPresence;
                    if (!['available', 'composing', 'recording'].includes(status)) continue;
                    const num = toNum(jid);
                    const server = toServer(jid);
                    const resolved = server === 'lid' ? (lidToPhone[num] || null) : (num + '@s.whatsapp.net');
                    if (resolved && participantPhoneJids.has(resolved)) {
                        presenceMap[resolved] = status;
                    }
                }
            };

            client.ev.on('presence.update', presenceHandler);
            try { await client.presenceSubscribe(m.chat); } catch {}

            for (const p of participants) {
                const raw = (p.jid || p.id || '').split(':')[0];
                if (raw) { try { await client.presenceSubscribe(raw); } catch {} }
            }

            await new Promise(res => setTimeout(res, 5000));
            client.ev.off('presence.update', presenceHandler);

            const onlineJids = Object.keys(presenceMap);

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
