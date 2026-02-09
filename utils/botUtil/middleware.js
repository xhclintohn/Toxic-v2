const middleware = async (context, next) => {
    const { m, client } = context;

    console.log('=== ADMIN CHECK MIDDLEWARE ===');
    console.log('Group:', m.chat);
    console.log('Bot:', client.user.id);
    console.log('Sender:', m.sender);

    if (!m.isGroup) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ This command isn't for lone wolves. Try again in a group. 🐺
◈━━━━━━━━━━━━━━━━◈`);
    }
    
    try {
        // Get group metadata
        const groupMetadata = await client.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        
        // Helper function to extract phone number from any format
        const extractPhone = (id) => {
            if (!id) return null;
            
            // Handle LID format: 106236687175694@lid
            if (id.includes('@lid')) {
                console.log('LID format detected:', id);
                // We can't extract phone from LID directly
                // But we'll keep it for comparison
                return id;
            }
            
            // Handle JID format: 254799283147:12@s.whatsapp.net
            // or: 254735342808@s.whatsapp.net
            const cleanId = id.split('@')[0]; // Remove @s.whatsapp.net
            const phone = cleanId.split(':')[0]; // Remove :12 suffix if exists
            return phone;
        };
        
        // Get phone numbers/LIDs
        const botId = extractPhone(client.user.id);
        const senderId = extractPhone(m.sender);
        
        console.log('Bot identifier:', botId);
        console.log('Sender identifier:', senderId);
        
        // Check admin status
        let isAdmin = false;
        let isBotAdmin = false;
        
        // METHOD 1: First try exact ID matching (for LIDs)
        for (const p of participants) {
            // Exact match (works for LIDs)
            if (p.id === senderId || p.id === m.sender) {
                isAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                console.log('Exact match found for sender:', p.id, 'Admin:', isAdmin);
            }
            
            if (p.id === botId || p.id === client.user.id) {
                isBotAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                console.log('Exact match found for bot:', p.id, 'Admin:', isBotAdmin);
            }
        }
        
        // METHOD 2: If no exact match, try phone number matching (for JIDs)
        if (!isAdmin || !isBotAdmin) {
            console.log('Trying phone number matching...');
            
            // Get just the phone numbers (strip country code if needed)
            const senderPhone = senderId ? senderId.replace('254', '0') : null;
            const botPhone = botId ? botId.replace('254', '0') : null;
            
            console.log('Sender phone:', senderPhone);
            console.log('Bot phone:', botPhone);
            
            for (const p of participants) {
                // Check if participant ID contains the phone number
                const participantPhone = extractPhone(p.id);
                
                if (participantPhone && senderPhone && 
                    (participantPhone.includes(senderPhone) || senderPhone.includes(participantPhone))) {
                    isAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                    console.log('Phone match for sender:', p.id, 'Admin:', isAdmin);
                }
                
                if (participantPhone && botPhone && 
                    (participantPhone.includes(botPhone) || botPhone.includes(participantPhone))) {
                    isBotAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                    console.log('Phone match for bot:', p.id, 'Admin:', isBotAdmin);
                }
            }
        }
        
        // METHOD 3: Use message metadata (Baileys specific)
        if (!isAdmin && m.key && m.key.participant) {
            const senderLid = m.key.participant;
            console.log('Trying message participant LID:', senderLid);
            
            const senderParticipant = participants.find(p => p.id === senderLid);
            if (senderParticipant) {
                isAdmin = senderParticipant.admin === 'admin' || senderParticipant.admin === true;
                console.log('Found via message LID. Admin:', isAdmin);
            }
        }
        
        // FINAL CHECK
        console.log('FINAL - User Admin:', isAdmin, 'Bot Admin:', isBotAdmin);
        
        if (!isAdmin) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ You think you're worthy? 
│❒ Admin privileges are required—go beg for them. 😤
◈━━━━━━━━━━━━━━━━◈`);
        }
        
        if (!isBotAdmin) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ I need admin rights to obey, unlike you who blindly follows. 🫵 
◈━━━━━━━━━━━━━━━━◈`);
        }

        await next();
    } catch (error) {
        console.error('Middleware error:', error);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ Error checking permissions. Try again later. ⚠️
◈━━━━━━━━━━━━━━━━◈`);
    }
};

module.exports = middleware;