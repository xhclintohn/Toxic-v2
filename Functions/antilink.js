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

        const botNumber = await client.decodeJid(client.user.id);
        const sender = m.sender ? await client.decodeJid(m.sender) : null;
        
        console.log('👤 Sender:', sender);
        console.log('🤖 Bot number:', botNumber);

        if (!sender) {
            console.log('❌ No sender found');
            return;
        }

        const groupMetadata = await client.groupMetadata(m.chat).catch(() => null);
        if (!groupMetadata) {
            console.log('❌ Could not fetch group metadata');
            return;
        }

        console.log('👥 Group participants:', groupMetadata.participants?.length);

        const participants = groupMetadata.participants || [];
        
        // Normalize JID formats for comparison
        const normalizeJid = (jid) => {
            if (!jid) return '';
            // Remove any suffixes and keep only the number part
            return jid.replace(/@[^.]+\.net$/, '').replace(/@lid$/, '');
        };

        const botNormalized = normalizeJid(botNumber);
        const senderNormalized = normalizeJid(sender);
        
        const admins = participants
            .filter(p => p.admin)
            .map(p => normalizeJid(p.id));
        
        console.log('👑 Normalized Admins:', admins);
        console.log('🤖 Normalized Bot:', botNormalized);
        console.log('👤 Normalized Sender:', senderNormalized);
        console.log('✅ Is sender admin?', admins.includes(senderNormalized));
        console.log('✅ Is bot admin?', admins.includes(botNormalized));

        // Allow admins to send links
        if (admins.includes(senderNormalized)) {
            console.log('✅ Sender is admin, allowing link');
            return;
        }

        // Bot needs to be admin to delete messages
        if (!admins.includes(botNormalized)) {
            console.log('❌ Bot is not admin, cannot delete messages');
            return;
        }

        // Extract message text from different message types
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
                    participant: sender
                }
            });
            console.log('✅ Message deleted successfully');
        } catch (deleteError) {
            console.log('❌ Failed to delete message:', deleteError.message);
        }

        // Send warning message
        await client.sendMessage(m.chat, {
            text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Links are not allowed here! ⚠️\n│❒ Your message has been deleted.\n┗━━━━━━━━━━━━━━━┛`,
            mentions: [sender]
        });

        console.log('✅ Antilink action completed');

    } catch (e) {
        console.error("❌ Antilink Error:", e.message);
        console.error(e.stack);
    }
};