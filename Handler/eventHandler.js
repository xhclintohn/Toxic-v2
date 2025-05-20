const { getGroupSetting, getSudoUsers } = require("../Database/config");

const Events = async (client, event, pict) => {
    const botJid = await client.decodeJid(client.user.id);

    try {
        const metadata = await client.groupMetadata(event.id);
        const participants = event.participants;
        const desc = metadata.desc || "No Description";
        const groupSettings = await getGroupSetting(event.id);
        const eventsEnabled = groupSettings?.events === true; // Strict boolean check
        const antidemote = groupSettings?.antidemote === true;
        const antipromote = groupSettings?.antipromote === true;
        const sudoUsers = await getSudoUsers();
        const currentDevs = Array.isArray(sudoUsers)
            ? sudoUsers.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net")
            : [];

        // Debug log to verify settings
        console.log(`🔍 Group ${event.id}: events=${eventsEnabled}, action=${event.action}`);

        for (const participant of participants) {
            let dpUrl = pict;
            try {
                dpUrl = await client.profilePictureUrl(participant, "image");
            } catch {
                dpUrl = pict; // Fallback to context-provided pict
            }

            if (eventsEnabled && event.action === "add") {
                try {
                    const userName = participant.split("@")[0];
                    const welcomeText = `🌟 *Welcome to ${metadata.subject}* 🌟\n\n` +
                                       `👋 *Hello @${userName}!*\n\n` +
                                       `─── ✦ Group Info ✦ ───\n` +
                                       `📌 *Group*: ${metadata.subject}\n` +
                                       `📝 *Description*: ${desc}\n\n` +
                                       `Enjoy your stay! 🚀\n\n` +
                                       `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                       `*Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*`;

                    await client.sendMessage(event.id, {
                        image: { url: dpUrl },
                        caption: welcomeText,
                        mentions: [participant]
                    });
                    console.log(`📥 Sent welcome message for ${participant} in ${event.id}`);
                } catch (err) {
                    console.error(`❌ Error sending welcome message for ${participant}:`, err);
                }
            } else if (eventsEnabled && event.action === "remove") {
                try {
                    const userName = participant.split("@")[0];
                    const leaveText = `🚪 *Goodbye @${userName}* 🚪\n\n` +
                                      `We'll miss you... maybe! 😎\n\n` +
                                      `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                      `*Powered by 𝐓𝐎𝐖𝐩𝐈𝐂-𝐌𝐃 𝐕3*`;

                    await client.sendMessage(event.id, {
                        image: { url: dpUrl },
                        caption: leaveText,
                        mentions: [participant]
                    });
                    console.log(`📤 Sent goodbye message for ${participant} in ${event.id}`);
                } catch (err) {
                    console.error(`❌ Error sending goodbye message for ${participant}:`, err);
                }
            } else if (!eventsEnabled && (event.action === "add" || event.action === "remove")) {
                console.log(`🚫 Skipped ${event.action} message for ${participant} in ${event.id}: events disabled`);
            }

            if (event.action === "demote" && antidemote) {
                try {
                    if (
                        event.author === metadata.owner ||
                        event.author === botJid ||
                        event.author === participant ||
                        currentDevs.includes(event.author)
                    ) {
                        await client.sendMessage(event.id, {
                            text: `🔽 *Super user demoted @${participant.split("@")[0]}*\n\n` +
                                  `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                  `*Powered by 𝐓𝐎𝐖𝐩𝐈𝐂-𝐌𝐃 𝐕3*`,
                            mentions: [participant]
                        });
                        console.log(`🔽 Super user demoted ${participant} in ${event.id}`);
                        return;
                    }

                    await client.groupParticipantsUpdate(event.id, [event.author], "demote");
                    await client.groupParticipantsUpdate(event.id, [participant], "promote");

                    await client.sendMessage(event.id, {
                        text: `🔽 *@${event.author.split("@")[0]} demoted for demoting @${participant.split("@")[0]}!*\n\n` +
                              `Antidemote is active. Only super users can demote.\n\n` +
                              `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-�{M𝐃 𝐕3 ✪ ═══✧\n` +
                              `*Powered by 𝐀𝐓𝐎𝐖𝐩𝐈𝐂-𝐌𝐃 𝐕3*`,
                        mentions: [event.author, participant]
                    });
                    console.log(`🔽 Handled antidemote for ${participant} in ${event.id}`);
                } catch (err) {
                    console.error(`❌ Error handling demote for ${participant}:`, err);
                }
            } else if (event.action === "promote" && antipromote) {
                try {
                    if (
                        event.author === metadata.owner ||
                        event.author === botJid ||
                        event.author === participant ||
                        currentDevs.includes(event.author)
                    ) {
                        await client.sendMessage(event.id, {
                            text: `🔼 *Super user promoted @${participant.split("@")[0]}*\n\n` +
                                  `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                                  `*Powered by 𝐓𝐎x𝐈𝐂-𝐌�{D 𝐕3*`,
                            mentions: [participant]
                        });
                        console.log(`🔼 Super user promoted ${participant} in ${event.id}`);
                        return;
                    }

                    await client.groupParticipantsUpdate(event.id, [event.author, participant], "demote");

                    await client.sendMessage(event.id, {
                        text: `🔼 *@${event.author.split("@")[0]} demoted for promoting @${participant.split("@")[0]}!*\n\n` +
                              `@${participant.split("@")[0]} has also been demoted. Antipromote is active. Only super users can promote.\n\n` +
                              `✧═══ ✪ 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                              `*Powered by 𝐓𝐎x𝐈𝐂-�{M𝐃 𝐕3*`,
                        mentions: [event.author, participant]
                    });
                    console.log(`🔼 Handled antipromote for ${participant} in ${event.id}`);
                } catch (err) {
                    console.error(`❌ Error handling promote for ${participant}:`, err);
                }
            }
        }
    } catch (err) {
        console.error(`❌ Error in group events handler for ${event.id}:`, err);
        await client.sendMessage(event.id, {
            text: `⚠️ *Oops! Failed to process group event:* ${err.message}\n\n` +
                  `✧═══ ✪ 𝐓𝐎x𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n` +
                  `*Powered by 𝐓𝐎𝐖x𝐂-𝐌𝐃 �{V3*`
        }).catch(() => {});
    }
};

module.exports = Events;