const { getGroupSettings, getSudoUsers } = require("../database/config");

const Events = async (client, event, pict) => {
    const botJid = await client.decodeJid(client.user.id);

    try {
        const metadata = await client.groupMetadata(event.id);
        const participants = event.participants;
        const desc = metadata.desc || "Some boring group, I guess.";
        const groupSettings = await getGroupSettings(event.id);
        const eventsEnabled = groupSettings?.events === true;
        const antidemote = groupSettings?.antidemote === true;
        const antipromote = groupSettings?.antipromote === true;
        const sudoUsers = await getSudoUsers();
        const currentDevs = Array.isArray(sudoUsers)
            ? sudoUsers.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            : [];

        const dpPromises = participants.map(async (participant) => {
            try {
                return await client.profilePictureUrl(participant, "image");
            } catch {
                return pict;
            }
        });
        
        const dpUrls = await Promise.all(dpPromises);

        if (eventsEnabled && event.action === "add") {
            try {
                const messages = participants.map((participant, index) => {
                    const userName = participant.split("@")[0];
                    return {
                        image: { url: dpUrls[index] },
                        caption: 
`╭───「 💉 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 💉 」
│ 😈 *Yo, @${userName}, welcome to the chaos!*  
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐕3
│ 🦁 *Group*: ${metadata.subject}
│ 📜 *Desc*: ${desc}
│
│ 😼 *Try not to get roasted too hard, newbie!*
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃  🔥 」`,
                        mentions: [participant]
                    };
                });

                for (const message of messages) {
                    await client.sendMessage(event.id, message);
                }
            } catch {
            }
        } else if (eventsEnabled && event.action === "remove") {
            try {
                const messages = participants.map((participant, index) => {
                    const userName = participant.split("@")[0];
                    return {
                        image: { url: dpUrls[index] },
                        caption: 
`╭───「 🚪 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐄𝐱𝐢𝐭 🚪 」
│ 😎 *Later, @${userName}! Couldn’t handle the heat?*  
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃
│ 🦁 *Group*: ${metadata.subject}
│
│ 😜 *Don’t cry, we’ll survive without ya!*
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 🔥 」`,
                        mentions: [participant]
                    };
                });

                for (const message of messages) {
                    await client.sendMessage(event.id, message);
                }
            } catch {
            }
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
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-𝐌𝐃 𝐕3
│ 🦁 *Group*: ${metadata.subject}
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-M𝐃 🔥 」`,
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
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢𝐜-M𝐃
│ 🦁 *Group*: ${metadata.subject}
│ 📜 *Rule*: Antidemote’s on, loser. Only the big dogs can demote!
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-M𝐃 🔥 」`,
                    mentions: [event.author, participant]
                });
            } catch {
            }
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
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢c-M𝐃
│ 🦁 *Group*: ${metadata.subject}
╰───「 🔥 Powered by 𝐓𝐨𝐱𝐢𝐜-M𝐃 🔥 」`,
                        mentions: [participant]
                    });
                    return;
                }

                await client.groupParticipantsUpdate(event.id, [event.author, participant], "demote");

                await client.sendMessage(event.id, {
                    text: 
`╭───「 🔼 𝐓𝐨𝐱𝐢𝐜-M𝐃 𝐀𝐧𝐭𝐢𝐩𝐫𝐨𝐦𝐨𝐭𝐞 🔼 」
│ 😆 *Oof, @${event.author.split("@")[0]}! Demoted for trying to boost @${participant.split("@")[0]}!*  
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢c-M𝐃
│ 🦁 *Group*: ${metadata.subject}
│ 📜 *Rule*: @${participant.split("@")[0]} got yeeted too. Antipromote’s on, only the elite can promote!
╰───「 🔥 Powered by T𝐨𝐱𝐢c-M𝐃 🔥 」`,
                    mentions: [event.author, participant]
                });
            } catch {
            }
        }
    } catch {
        try {
            await client.sendMessage(event.id, {
                text: 
`╭───「 ⚠️ 𝐓𝐨𝐱𝐢c-M𝐃 𝐄𝐫𝐫𝐨𝐫 ⚠️ 」
│ 😬 *Yikes, something broke. Blame the group vibes!*  
│
│ 🤖 *Bot*: 𝐓𝐨𝐱𝐢c-M𝐃 
│ 🦁 *Group*: ${metadata.subject}
╰───「 🔥 Powered by T𝐨𝐱𝐢c-M𝐃 🔥 」`
            });
        } catch {
        }
    }
};

module.exports = Events;