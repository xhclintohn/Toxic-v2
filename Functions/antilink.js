const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        // Early exit for invalid or non-group messages
        if (!m || !m.key || !m.message || !m.key.remoteJid.endsWith("@g.us")) {
            console.log(`Toxic-MD Antilink: Skipped - Invalid message or not a group (remoteJid=${m.key.remoteJid})`);
            return;
        }

        const settings = await getSettings();
        if (!settings || !settings.antilink) {
            console.log(`Toxic-MD Antilink: Skipped - antilink=${settings?.antilink}, remoteJid=${m.key.remoteJid}`);
            return;
        }

        const botNumber = await client.decodeJid(client.user.id);
        const sender = m.sender ? await client.decodeJid(m.sender) : (m.key.participant ? await client.decodeJid(m.key.participant) : null);
        const pushName = m.pushName || "loser";

        // Debug: Log raw m.sender and m.key
        console.log(`Toxic-MD Antilink: Raw m.sender=${m.sender}, m.key=${JSON.stringify(m.key)}`);

        if (!sender) {
            console.log(`Toxic-MD Antilink: Skipped - No valid sender for message in ${m.key.remoteJid}`);
            return;
        }

        const messageContent = (
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            m.message?.documentMessage?.caption ||
            ""
        ).toLowerCase();

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
        if (!urlRegex.test(messageContent)) {
            console.log(`Toxic-MD Antilink: No URL detected in message: ${messageContent}`);
            return;
        }

        console.log(`Toxic-MD Antilink: URL detected in ${m.key.remoteJid} by ${sender}: ${messageContent}`);

        const groupMetadata = await client.groupMetadata(m.key.remoteJid).catch(e => {
            console.error(`Toxic-MD Antilink: Failed to fetch group metadata for ${m.key.remoteJid}:`, e);
            return null;
        });
        if (!groupMetadata || !groupMetadata.participants) {
            console.log(`Toxic-MD Antilink: Invalid group metadata for ${m.key.remoteJid}`);
            return;
        }

        const groupAdmins = groupMetadata.participants
            .filter(p => p.admin != null)
            .map(p => client.decodeJid(p.id));
        const isBotAdmin = groupAdmins.includes(botNumber);
        const isSenderAdmin = groupAdmins.includes(sender);

        console.log(`Toxic-MD Antilink: BotAdmin=${isBotAdmin}, SenderAdmin=${isSenderAdmin}, Sender=${sender}`);

        // Skip if sender is an admin or the bot itself
        if (isSenderAdmin || sender === botNumber) {
            console.log(`Toxic-MD Antilink: Skipped - Sender is admin or bot (SenderAdmin=${isSenderAdmin}, Sender=${sender})`);
            return;
        }

        if (isBotAdmin) {
            // Delete the message using sendMessage
            try {
                await client.sendMessage(m.key.remoteJid, {
                    delete: {
                        remoteJid: m.key.remoteJid,
                        fromMe: false,
                        id: m.key.id,
                        participant: sender
                    }
                });
                console.log(`Toxic-MD Antilink: Deleted message with URL in ${m.key.remoteJid} from ${sender}`);
            } catch (e) {
                console.error(`Toxic-MD Antilink: Failed to delete message in ${m.key.remoteJid}:`, e);
            }

            // Send warning message without link preview
            await client.sendMessage(
                m.key.remoteJid,
                {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${pushName}! Links are banned here, you dumbass! 😈 Keep it up, and you’re toast! 🦁\n┗━━━━━━━━━━━━━━━┛`,
                    footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ"
                }
            );
            console.log(`Toxic-MD Antilink: Sent warning to ${sender} in ${m.key.remoteJid}`);
        } else {
            console.log(`Toxic-MD Antilink: Skipped deletion - Bot is not admin (BotAdmin=${isBotAdmin})`);
        }
    } catch (e) {
        console.error("Toxic-MD Antilink Error:", e);
    }
};