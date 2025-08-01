const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        if (!m || !m.key || !m.message) {
            console.log(`Toxic-MD Antilink: Skipped - Invalid message`);
            return;
        }
        const settings = await getSettings();
        if (!settings || !settings.antilink || typeof m.key.remoteJid !== "string" || !m.key.remoteJid.endsWith("@g.us")) {
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
            try {
                await client.sendMessage(m.key.remoteJid, {
                    delete: {
                        remoteJid: m.key.remoteJid,
                        fromMe: false,
                        id: m.key.id,
                        participant: m.sender
                    }
                });
                console.log(`Toxic-MD Antilink: Deleted message with URL in ${m.key.remoteJid} from ${m.sender}`);
            } catch (e) {
                console.error(`Toxic-MD Antilink: Failed to delete message in ${m.key.remoteJid}:`, e);
            }
        } else {
            console.log(`Toxic-MD Antilink: Skipped deletion - BotAdmin=${isBotAdmin}, SenderAdmin=${isSenderAdmin}`);
        }
    } catch (e) {
        console.error("Toxic-MD Antilink Error:", e);
    }
};