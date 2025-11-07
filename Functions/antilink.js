const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;

        const settings = await getSettings();
        if (!settings?.antilink) return;
        if (!m.isGroup) return;

        // Admin Detection
        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        // Allow admins to send links
        if (isAdmin) return;

        // Bot needs to be admin to delete messages
        if (!isBotAdmin) {
            console.log('❌ Bot is not admin, cannot delete messages');
            return;
        }

        // Extract message content
        let messageContent = '';

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

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|whatsapp\.com\/[^\s]+)/gi;
        const hasLink = urlRegex.test(messageContent.toLowerCase());

        if (!hasLink) return;

        console.log('🚫 Link detected! Deleting message...');

        // Try to delete the message
        try {
            await client.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: m.key.id,
                    participant: m.sender
                }
            });
        } catch (deleteError) {
            console.log('❌ Failed to delete message:', deleteError.message);
            return;
        }

        // Send warning message
        await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Links are not allowed here! ⚠️\n│❒ Your message has been deleted.\n┗━━━━━━━━━━━━━━━┛`,
            mentions: [m.sender]
        });

    } catch (e) {
        console.error("❌ Antilink Error:", e.message);
    }
};