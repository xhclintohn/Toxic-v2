const { getGroupSetting, getSudoUsers } = require("../Database/config");

const Events = async (client, event, pict) => {
    const botJid = await client.decodeJid(client.user.id);
    const ownerJid = "254735342808@s.whatsapp.net"; // Your number

    try {
        const metadata = await client.groupMetadata(event.id);
        const participants = event.participants;
        const desc = metadata.desc || "No Description";
        const groupSettings = await getGroupSetting(event.id);
        const eventsEnabled = groupSettings?.events;
        const antidemote = groupSettings?.antidemote;
        const antipromote = groupSettings?.antipromote;
        const sudoUsers = await getSudoUsers();
        const currentDevs = Array.isArray(sudoUsers)
            ? sudoUsers.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            : [];

        for (const participant of participants) {
            let dpUrl = pict;
            try {
                dpUrl = await client.profilePictureUrl(participant, "image");
            } catch {
                dpUrl = pict; // Fallback to context-provided pict
            }

            if (eventsEnabled && event.action === "add") {
                // Auto-promote owner if they join and bot is admin
                if (participant === ownerJid) {
                    try {
                        const groupAdmins = metadata.participants.filter(p => p.admin != null).map(p => p.id);
                        const isBotAdmin = groupAdmins.includes(botJid);
                        console.log(`[AUTOPROMOTE-DEBUG] Group: ${event.id}, Bot admin: ${isBotAdmin}, Admins: ${JSON.stringify(groupAdmins)}`);

                        if (!isBotAdmin) {
                            console.log(`[AUTOPROMOTE-DEBUG] Bot is not admin in ${event.id}, skipping autopromote`);
                            await client.sendMessage(event.id, {
                                text: `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                      `🔥 * YOU LAZY FUCKS!* 😤 The king @${ownerJid.split("@")[0]} joined, but I’m not admin to crown them! Make me admin, you idiots!\n` +
                                      `*Powered by 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3*`,
                                mentions: [ownerJid]
                            });
                        } else {
                            await client.groupParticipantsUpdate(event.id, [ownerJid], "promote");
                            console.log(`[AUTOPROMOTE-DEBUG] Promoted ${ownerJid} to admin in ${event.id}`);
                            await client.sendMessage(event.id, {
                                image: { url: dpUrl },
                                caption: `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                         `👑 *BOW DOWN, YOU WORTHLESS PLEBS!* 😤 The king @${ownerJid.split("@")[0]} is now ADMIN! Try me, losers!\n` +
                                         `*Powered by 𝐓𝐎𝐗𝐈𝐂-�{M𝐃 𝐕3*`,
                                mentions: [ownerJid]
                            });
                        }
                    } catch (err) {
                        console.error(`[AUTOPROMOTE-ERROR] Failed to promote ${ownerJid} in ${event.id}: ${err.stack}`);
                        await client.sendMessage(event.id, {
                            text: `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                  `💥 *FUCK THIS SHIT!* 😡 Tried to crown @${ownerJid.split("@")[0]} as admin, but it broke: ${err.message}. Fix it, you morons!\n` +
                                  `*Powered by 𝐓𝐎𝐗𝐈𝐂-�{M𝐃 𝐕3*`,
                            mentions: [ownerJid]
                        }).catch(() => {});
                    }
                }

                // Existing welcome message
                try {
                    const userName = participant.split("@")[0];
                    const welcomeText = `🌟 *Welcome to ${metadata.subject}* 🌟\n\n` +
                                       `👋 *Hello @${userName}!*\n\n` +
                                       `─── ✦ Group Info ✦ ───\n` +
                                       `📌 *Group*: ${metadata.subject}\n` +
                                       `📝 *Description*: ${desc}\n\n` +
                                       `Enjoy your stay! 🚀\n\n` +
                                       `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-�{M𝐃 𝐕3 ✪ ═══✧\n` +
                                       `*Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*`;

                    await client.sendMessage(event.id, {
                        image: { url: dpUrl },
                        caption: welcomeText,
                        mentions: [participant]
                    });
                } catch (err) {
                    console.error(`Error sending welcome message for ${participant}:`, err);
                }
            } else if (eventsEnabled && event.action === "remove") {
                try {
                    const userName = participant.split("@")[0];
                    const leaveText = `🚪 *Goodbye @${userName}* 🚪\n\n` +
                                      `We'll miss you... maybe! 😎\n\n` +
                                      `✧═══ ✪ �{T𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                      `*Powered by 𝐓𝐎𝐖𝐩𝐈𝐂-�{M𝐃 𝐕3*`;

                    await client.sendMessage(event.id, {
                        image: { url: dpUrl },
                        caption: leaveText,
                        mentions: [participant]
                    });
                } catch (err) {
                    console.error(`Error sending leave message for ${participant}:`, err);
                }
            } else if (event.action === "demote" && antidemote) {
                try {
                    if (
                        event.author === metadata.owner ||
                        event.author === botJid ||
                        event.author === participant ||
                        currentDevs.includes(event.author)
                    ) {
                        await client.sendMessage(event.id, {
                            text: `🔽 *Super user demoted @${participant.split("@")[0]}*\n\n` +
                                  `✧═══ ✪ 𝐓𝐎�{X𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                  `*Powered by 𝐓𝐎𝐖𝐩𝐈�{C-𝐌𝐃 𝐕3*`,
                            mentions: [participant]
                        });
                        return;
                    }

                    await client.groupParticipantsUpdate(event.id, [event.author], "demote");
                    await client.groupParticipantsUpdate(event.id, [participant], "promote");

                    await client.sendMessage(event.id, {
                        text: `🔽 *@${event.author.split("@")[0]} demoted for demoting @${participant.split("@")[0]}!*\n\n` +
                              `Antidemote is active. Only super users can demote.\n\n` +
                              `✧═══ ✪ �{T𝐎𝐗𝐈𝐂-�{M𝐃 𝐕3 ✪ ═══✧\n` +
                              `*Powered by 𝐀𝐓𝐎𝐖𝐩𝐈�{C-𝐌𝐃 𝐕3*`,
                            mentions: [event.author, participant]
                        });
                } catch (err) {
                    console.error(`Error handling demote for ${participant}:`, err);
                }
            } else if (event.action === "promote" && antipromote) {
                try {
                    // Skip antipromote for owner
                    if (participant === ownerJid) {
                        await client.sendMessage(event.id, {
                            text: `🔼 *King @${participant.split("@")[0]} promoted!* 😤 Antipromote bypassed for the boss!\n\n` +
                                  `✧═══ ✪ 𝐓�{O𝐗𝐈𝐂-�{M𝐃 𝐕3 ✪ ═══✧\n` +
                                  `*Powered by 𝐓�{O𝐗𝐈𝐂-�{M𝐃 𝐕3*`,
                            mentions: [participant]
                        });
                        return;
                    }

                    if (
                        event.author === metadata.owner ||
                        event.author === botJid ||
                        event.author === participant ||
                        currentDevs.includes(event.author)
                    ) {
                        await client.sendMessage(event.id, {
                            text: `🔼 *Super user promoted @${participant.split("@")[0]}*\n\n` +
                                  `✧═══ ✪ �{T𝐎𝐗𝐈�{C-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                  `*Powered by �{T𝐎𝐗𝐈�{C-𝐌𝐃 𝐕3*`,
                            mentions: [participant]
                        });
                        return;
                    }

                    await client.groupParticipantsUpdate(event.id, [event.author, participant], "demote");

                    await client.sendMessage(event.id, {
                        text: `🔼 *@${event.author.split("@")[0]} demoted for promoting @${participant.split("@")[0]}!*\n\n` +
                              `@${participant.split("@")[0]} has also been demoted. Antipromote is active. Only super users can promote.\n\n` +
                              `✧═══ ✪ �{T𝐎𝐗𝐈�{C-�{M𝐃 𝐕3 ✪ ═══✧\n` +
                              `*Powered by �{T𝐎𝐗𝐈�{C-�{M𝐃 𝐕3*`,
                            mentions: [event.author, participant]
                    });
                } catch (err) {
                    console.error(`Error handling promote for ${participant}:`, err);
                }
            }
        }
    } catch (err) {
        console.error('Error in group events handler:', err);
        await client.sendMessage(event.id, {
            text: `⚠️ *Oops! Failed to process group event:* ${err.message}\n\n` +
                  `✧═══ ✪ �{T𝐎𝐗𝐈�{C-�{M𝐃 𝐕3 ✪ ═══✧\n` +
                  `*Powered by �{T𝐎𝐖𝐱𝐂-�{M𝐃 𝐕3*`
        }).catch(() => {});
    }
};

module.exports = Events;