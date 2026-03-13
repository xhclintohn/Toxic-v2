const { getGroupSettings, getSudoUsers } = require("../database/config");

const Events = async (client, event, pict) => {
    const botJid = await client.decodeJid(client.user.id);

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
            ? sudoUsers.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
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
`╭───「 💉 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 💉 」
│ 😈 *Yo, @${userName}, welcome to the chaos!*
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
│ 📜 *Desc*: ${desc}
│
│ 😼 *Try not to get roasted too hard, newbie!*
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
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
`╭───「 🚪 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐆𝐨𝐨𝐝𝐛𝐲𝐞 🚪 」
│ 😎 *Later, @${userName}! Couldn't handle the heat?*
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
│
│ 😜 *Don't cry, we'll survive without ya!*
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
                        mentions: [participant]
                    });
                }
            } catch {}
        }

        if (event.action === "demote" && antidemote) {
            try {
                const participant = participants[0];
                if (
                    event.author === metadata.owner ||
                    event.author === botJid ||
                    event.author === participant ||
                    currentDevs.includes(event.author)
                ) {
                    await client.sendMessage(event.id, {
                        text:
`╭───「 🔽 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐃𝐞𝐦𝐨𝐭𝐢𝐨𝐧 🔽 」
│ 😤 *Big shot @${participant.split("@")[0]} got knocked down!*
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
                        mentions: [participant]
                    });
                    return;
                }

                await client.groupParticipantsUpdate(event.id, [event.author], "demote");
                await client.groupParticipantsUpdate(event.id, [participant], "promote");

                await client.sendMessage(event.id, {
                    text:
`╭───「 🔽 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐀𝐧𝐭𝐢𝐝𝐞𝐦𝐨𝐭𝐞 🔽 」
│ 😏 *Nice try, @${event.author.split("@")[0]}! Demoted for messing with @${participant.split("@")[0]}!*
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
│ 📜 *Rule*: Antidemote is on. Only the big dogs can demote!
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
                    mentions: [event.author, participant]
                });
            } catch {}
        } else if (event.action === "promote" && antipromote) {
            try {
                const participant = participants[0];
                if (
                    event.author === metadata.owner ||
                    event.author === botJid ||
                    event.author === participant ||
                    currentDevs.includes(event.author)
                ) {
                    await client.sendMessage(event.id, {
                        text:
`╭───「 🔼 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐏𝐫𝐨𝐦𝐨𝐭𝐢𝐨𝐧 🔼 」
│ 😎 *Big dog @${participant.split("@")[0]} just leveled up!*
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
                        mentions: [participant]
                    });
                    return;
                }

                await client.groupParticipantsUpdate(event.id, [event.author, participant], "demote");

                await client.sendMessage(event.id, {
                    text:
`╭───「 🔼 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐀𝐧𝐭𝐢𝐩𝐫𝐨𝐦𝐨𝐭𝐞 🔼 」
│ 😆 *Oof, @${event.author.split("@")[0]}! Demoted for trying to boost @${participant.split("@")[0]}!*
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
│ 📜 *Rule*: Antipromote is on. Only the elite can promote!
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
                    mentions: [event.author, participant]
                });
            } catch {}
        }
    } catch {}
};

module.exports = Events;
