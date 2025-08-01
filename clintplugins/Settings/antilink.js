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

        console.log(`Toxic-MD Antilink: URL detected in ${m.key.remoteJid} by ${m.sender}: ${messageContent}`);

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
        const isSenderAdmin = groupAdmins.includes(m.sender);

        console.log(`Toxic-MD Antilink: BotAdmin=${isBotAdmin}, SenderAdmin=${isSenderAdmin}, Sender=${m.sender}`);

        if (isBotAdmin && !isSenderAdmin && m.sender !== botNumber) {
            // Delete the message instantly
            await client.sendMessage(m.key.remoteJid, {
                delete: {
                    remoteJid: m.key.remoteJid,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.sender
                }
            });
            console.log(`Toxic-MD Antilink: Deleted message with URL in ${m.key.remoteJid} from ${m.sender}`);

            // Send warning message immediately, quoting the sender's message
            await client.sendMessage(
                m.key.remoteJid,
                {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName || "loser"}! Links are banned here, you dumbass! 😈 Keep sending them, and you’re toast! 🦁\n┗━━━━━━━━━━━━━━━┛`,
                    footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: false,
                            title: "Toxic-MD Antilink",
                            body: "Link deleted. Don’t test me!",
                            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                },
                { quoted: m }
            );
            console.log(`Toxic-MD Antilink: Sent warning to ${m.sender} in ${m.key.remoteJid}`);
        } else {
            console.log(`Toxic-MD Antilink: Skipped deletion - BotAdmin=${isBotAdmin}, SenderAdmin=${isSenderAdmin}`);
        }
    } catch (e) {
        console.error("Toxic-MD Antilink Error:", e);
    }
};