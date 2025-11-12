const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        if (!m?.message) return;
        if (m.key.fromMe) return;

        const settings = await getSettings();
        if (!settings?.antilink) return;
        if (!m.isGroup) return;

        // Admin detection
        const isAdmin = m.isAdmin;
        const isBotAdmin = m.isBotAdmin;

        // Allow admins to send links
        if (isAdmin) return;

        // Bot must be admin for delete/remove actions
        if (!isBotAdmin) {
            console.log('❌ Bot is not admin, cannot delete or remove users.');
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

        // Detect links
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|whatsapp\.com\/[^\s]+)/gi;
        const hasLink = urlRegex.test(messageContent.toLowerCase());
        if (!hasLink) return;

        console.log('🚫 Link detected! Action triggered...');

        // Try deleting the message
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
        }

        // Identify antilink mode
        const antilinkMode = typeof settings.antilink === 'string' ? settings.antilink.toLowerCase() : 'delete';

        // Always warn the sender
        await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Link detected from @${m.sender.split('@')[0]} ⚠️\n│❒ Your message has been deleted.\n${antilinkMode === 'remove' ? '│❒ You will now be removed from this group! 🚫\n' : ''}┗━━━━━━━━━━━━━━━┛`,
            mentions: [m.sender]
        });

        // If antilink mode is "remove", also kick the sender
        if (antilinkMode === 'remove') {
            const users = m.sender;
            const parts = users.split('@')[0];

            try {
                await client.groupParticipantsUpdate(m.chat, [users], 'remove');
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ @${parts} has been removed for posting links! 🚫\n┗━━━━━━━━━━━━━━━┛`,
                    mentions: [users]
                });
            } catch (error) {
                console.error(`❌ Failed to remove user ${users}: ${error.stack}`);
                await client.sendMessage(m.chat, {
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn't remove @${parts}. Maybe I'm not admin? ⚠️\n┗━━━━━━━━━━━━━━━┛`,
                    mentions: [users]
                });
            }
        }

    } catch (e) {
        console.error("❌ Antilink Error:", e.message);
    }
};