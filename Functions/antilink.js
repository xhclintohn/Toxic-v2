const { getSettings } = require("../Database/config");

module.exports = async (client, m, store) => {
    try {
        console.log('🔍 Antilink triggered - Checking message...');

        if (!m?.message) {
            console.log('❌ No message content');
            return;
        }

        if (m.key.fromMe) {
            console.log('❌ Message from bot itself');
            return;
        }

        const settings = await getSettings();
        console.log('⚙️ Settings:', settings);

        if (!settings?.antilink) {
            console.log('❌ Antilink feature is disabled in settings');
            return;
        }

        if (!m.isGroup) {
            console.log('❌ Not a group message');
            return;
        }

        // DEBUG: Check if admin properties exist
        console.log('🔍 Available m properties:', {
            isGroup: m.isGroup,
            isAdmin: m.isAdmin,
            isBotAdmin: m.isBotAdmin,
            hasIsAdmin: 'isAdmin' in m,
            hasIsBotAdmin: 'isBotAdmin' in m
        });

        // USE THE SAME ADMIN DETECTION AS YOUR MIDDLEWARE
        const isAdmin = m.isAdmin; // This should be available if your middleware works
        const isBotAdmin = m.isBotAdmin; // This should be available if your middleware works

        console.log('✅ Is sender admin?', isAdmin);
        console.log('✅ Is bot admin?', isBotAdmin);

        // If admin properties are undefined, fall back to group metadata check
        if (isAdmin === undefined || isBotAdmin === undefined) {
            console.log('⚠️ Admin properties not found in m object, falling back to group metadata check');
            const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
            if (!groupMetadata) {
                console.log('❌ Could not fetch group metadata');
                return;
            }

            const participants = groupMetadata.participants || [];
            const botJid = client.decodeJid(client.user.id);
            
            const fallbackIsAdmin = participants.some(p => 
                p.id === m.sender && p.admin
            );
            
            const fallbackIsBotAdmin = participants.some(p => 
                p.id === botJid && p.admin
            );

            console.log('🔄 Fallback - Is sender admin?', fallbackIsAdmin);
            console.log('🔄 Fallback - Is bot admin?', fallbackIsBotAdmin);

            // Allow admins to send links
            if (fallbackIsAdmin) {
                console.log('✅ Sender is admin, allowing link');
                return;
            }

            // Bot needs to be admin to delete messages
            if (!fallbackIsBotAdmin) {
                console.log('❌ Bot is not admin, cannot delete messages');
                return;
            }
        } else {
            // Use the original admin properties from m object
            // Allow admins to send links
            if (isAdmin) {
                console.log('✅ Sender is admin, allowing link');
                return;
            }

            // Bot needs to be admin to delete messages
            if (!isBotAdmin) {
                console.log('❌ Bot is not admin, cannot delete messages');
                return;
            }
        }

        // Rest of your antilink logic...
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

        console.log('📝 Message content:', messageContent);

        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|whatsapp\.com\/[^\s]+)/gi;
        const hasLink = urlRegex.test(messageContent.toLowerCase());

        console.log('🔗 Has link?', hasLink);

        if (!hasLink) {
            console.log('❌ No links found in message');
            return;
        }

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
            console.log('✅ Message deleted successfully');
        } catch (deleteError) {
            console.log('❌ Failed to delete message:', deleteError.message);
        }

        // Send warning message
        await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Links are not allowed here! ⚠️\n│❒ Your message has been deleted.\n┗━━━━━━━━━━━━━━━┛`,
            mentions: [m.sender]
        });

        console.log('✅ Antilink action completed');

    } catch (e) {
        console.error("❌ Antilink Error:", e.message);
        console.error(e.stack);
    }
};