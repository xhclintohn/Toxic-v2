const { getGroupSettings, getSudoUsers } = require("../database/config");

const normalizeJid = (jid) => {
    if (!jid) return '';
    const stripped = jid.includes(':') ? jid.split(':')[0] + '@s.whatsapp.net' : jid;
    return stripped.replace('@lid', '@s.whatsapp.net');
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
            ? sudoUsers.map(v => normalizeJid(v.replace(/[^0-9]/g, "") + "@s.whatsapp.net"))
            : [];

        const dpUrls = await Promise.all(
            participants.map(async (participant) => {
                try {
                    return await client.profilePictureUrl(participant, "image");
                } catch {
                    return pict;
                }
            })
        );

        if (welcomeEnabled && event.action === "add") {
            try {
                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];
                    const userName = participant.split("@")[0];
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

        if (goodbyeEnabled && event.action === "remove") {
            try {
                for (let i = 0; i < participants.length; i++) {
                    const participant = participants[i];
                    const userName = participant.split("@")[0];
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
                if (
                    nAuthor === normalizeJid(metadata.owner) ||
                    nAuthor === botJid ||
                    nAuthor === nParticipant ||
                    currentDevs.includes(nAuthor) ||
                    currentDevs.includes(nParticipant)
                ) {
                    await client.sendMessage(event.id, {
                        text:
`╭───(    TOXIC-MD    )───
├───≫ DEMOTION ≪───
├ 
├ 😤 *Big shot @${participant.split("@")[0]} got knocked down!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [participant]
                    });
                    return;
                }

                await client.groupParticipantsUpdate(event.id, [event.author], "demote");
                await client.groupParticipantsUpdate(event.id, [participant], "promote");

                await client.sendMessage(event.id, {
                    text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIDEMOTE ≪───
├ 
├ 😏 *Nice try, @${event.author.split("@")[0]}! Demoted for messing with @${participant.split("@")[0]}!*
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
                if (
                    nAuthor === normalizeJid(metadata.owner) ||
                    nAuthor === botJid ||
                    nAuthor === nParticipant ||
                    currentDevs.includes(nAuthor) ||
                    currentDevs.includes(nParticipant)
                ) {
                    await client.sendMessage(event.id, {
                        text:
`╭───(    TOXIC-MD    )───
├───≫ PROMOTION ≪───
├ 
├ 😎 *Big dog @${participant.split("@")[0]} just leveled up!*
├ 
├ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
├ 🦁 *Group*: ${metadata.subject}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                        mentions: [participant]
                    });
                    return;
                }

                await client.groupParticipantsUpdate(event.id, [event.author, participant], "demote");

                await client.sendMessage(event.id, {
                    text:
`╭───(    TOXIC-MD    )───
├───≫ ANTIPROMOTE ≪───
├ 
├ 😆 *Oof, @${event.author.split("@")[0]}! Demoted for trying to boost @${participant.split("@")[0]}!*
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

module.exports = Events;
