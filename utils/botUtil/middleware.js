const middleware = async (context, next) => {
    const { m, client } = context;

    // DEBUG: Log initial values
    console.log('=== MIDDLEWARE DEBUG ===');
    console.log('Group ID:', m.chat);
    console.log('Bot User ID:', client.user.id);
    console.log('Sender ID:', m.sender);
    console.log('isGroup:', m.isGroup);

    if (!m.isGroup) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ This command isn't for lone wolves. Try again in a group. 🐺
◈━━━━━━━━━━━━━━━━◈`);
    }
    
    try {
        // Get group metadata
        const groupMetadata = await client.groupMetadata(m.chat);
        const participants = groupMetadata.participants;
        
        // DEBUG: Log all participants
        console.log('=== PARTICIPANTS ===');
        participants.forEach(p => {
            console.log(`ID: ${p.id}, Admin: ${p.admin}`);
        });
        
        // Helper function to normalize IDs for comparison
        const normalizeId = (id) => {
            // Remove all suffixes and prefixes
            return id.split('@')[0].split(':')[0];
        };
        
        // Get the bot's phone number (without country code)
        const botPhoneNumber = normalizeId(client.user.id); // "254799283147"
        const senderPhoneNumber = normalizeId(m.sender); // "254735342808"
        
        console.log('Bot Phone Number:', botPhoneNumber);
        console.log('Sender Phone Number:', senderPhoneNumber);
        
        // Check if bot is admin
        let isBotAdmin = false;
        let isAdmin = false;
        
        for (const p of participants) {
            const participantId = p.id;
            
            // Check for LID format OR regular format
            // LID format: 106236687175694@lid
            // Regular format: 254799283147:12@s.whatsapp.net
            
            if (participantId.includes('@lid')) {
                // For LID format, we need to check if this participant matches our numbers
                // We'll get the actual numbers from a mapping or cache
                // For now, we'll check admin status based on other methods
                
                // If you have a way to map LID to phone numbers, do it here
                // Otherwise, we need to use a different approach
                
                console.log('Found LID participant:', participantId);
            } else {
                // Regular format
                const participantPhoneNumber = normalizeId(participantId);
                
                // Check if this is the bot
                if (participantPhoneNumber === botPhoneNumber) {
                    isBotAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                    console.log('Found bot (regular format). Admin status:', p.admin, 'Result:', isBotAdmin);
                }
                
                // Check if this is the message sender
                if (participantPhoneNumber === senderPhoneNumber) {
                    isAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                    console.log('Found sender (regular format). Admin status:', p.admin, 'Result:', isAdmin);
                }
            }
        }
        
        // IF we didn't find in regular format, try alternative approach
        if (!isBotAdmin || !isAdmin) {
            console.log('Trying alternative LID mapping approach...');
            
            // Method 1: Use WhatsApp's internal mapping if available
            // Some libraries store LID-to-number mapping
            
            // Method 2: Fetch participant info differently
            try {
                // Try to get participant info using WhatsApp's methods
                const chat = await client.getChatById(m.chat);
                
                // Check bot admin status
                const me = chat.participants.find(p => 
                    p.id._serialized === client.user.id || 
                    p.id.user === botPhoneNumber
                );
                
                if (me) {
                    isBotAdmin = me.isAdmin || me.admin;
                    console.log('Alternative - Bot admin:', isBotAdmin, me);
                }
                
                // Check sender admin status
                const sender = chat.participants.find(p => 
                    p.id._serialized === m.sender || 
                    p.id.user === senderPhoneNumber
                );
                
                if (sender) {
                    isAdmin = sender.isAdmin || sender.admin;
                    console.log('Alternative - Sender admin:', isAdmin, sender);
                }
            } catch (altError) {
                console.log('Alternative method failed:', altError);
            }
        }
        
        console.log('FINAL - isBotAdmin:', isBotAdmin, 'isAdmin:', isAdmin);
        
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
        console.error('Error in middleware:', error);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈
│❒ Error checking permissions. Please try again. 🔧
◈━━━━━━━━━━━━━━━━◈`);
    }
};

module.exports = middleware;