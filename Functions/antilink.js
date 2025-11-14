const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;
        if (!m.isGroup) return;

        const settings = await getSettings();
        
        // STRICT MODE CHECK
        const antilinkMode = (settings.antilink || "off").toLowerCase();

        // ⛔ If OFF, do nothing
        if (antilinkMode === "off") return;

        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        // Allow admins to send links
        if (isAdmin) return;

        // Bot must be admin
        if (!isBotAdmin) {
            console.log("❌ Bot is not admin, cannot delete or remove users.");
            return;
        }

        // Extract message text
        let messageContent = "";

        if (m.message.conversation) {
            messageContent = m.message.conversation;
        } else if (m.message.extendedTextMessage?.text) {
            messageContent = m.message.extendedTextMessage.text;
        } else if (m.message.imageMessage?.caption) {
            messageContent = m.message.imageMessage.caption;
        } else if (m.message.videoMessage?.caption) {
            messageContent = m.message.videoMessage.caption;
        } else if (m.message.documentMessage?.caption) {
            messageContent = m.message.documentMessage.caption;
        }

        // URL detector
        const urlRegex =
            /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|whatsapp\.com\/[^\s]+)/gi;

        const hasLink = urlRegex.test(messageContent.toLowerCase());
        if (!hasLink) return;

        console.log("🚫 Link detected! Action triggered...");

        // Try deleting message
        try {
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.sender,
                },
            });
        } catch (err) {
            console.log("❌ Failed to delete message:", err.message);
        }

        // Warn user
        await client.sendMessage(m.chat, {
            text:
                `◈━━━━━━━━━━━━━━━━◈\n` +
                `│❒ Link detected from @${m.sender.split("@")[0]} ⚠️\n` +
                `│❒ Your message has been deleted.\n` +
                (antilinkMode === "remove"
                    ? `│❒ You will now be removed from this group! 🚫\n`
                    : "") +
                `┗━━━━━━━━━━━━━━━┛`,
            mentions: [m.sender],
        });

        // If mode = remove → kick user
        if (antilinkMode === "remove") {
            const user = m.sender;
            const part = user.split("@")[0];

            try {
                await client.groupParticipantsUpdate(m.chat, [user], "remove");

                await client.sendMessage(m.chat, {
                    text:
                        `◈━━━━━━━━━━━━━━━━◈\n` +
                        `│❒ @${part} has been removed for posting links! 🚫\n` +
                        `┗━━━━━━━━━━━━━━━┛`,
                    mentions: [user],
                });
            } catch (error) {
                console.log(`❌ Failed to remove ${user}:`, error.stack);

                await client.sendMessage(m.chat, {
                    text:
                        `◈━━━━━━━━━━━━━━━━◈\n` +
                        `│❒ Couldn't remove @${part}. Maybe I'm not admin? ⚠️\n` +
                        `┗━━━━━━━━━━━━━━━┛`,
                    mentions: [user],
                });
            }
        }
    } catch (e) {
        console.error("❌ Antilink Error:", e);
    }
};