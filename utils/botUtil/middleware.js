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
            console.log(`ID: ${p.id}, Admin: ${p.admin}, You: ${p.id.includes(client.user.id.split('@')[0])}, Sender: ${p.id.includes(m.sender.split('@')[0])}`);
        });
        
        // Helper function to normalize IDs
        const normalizeId = (id) => {
            // Remove @s.whatsapp.net, @c.us, @g.us and :number suffix
            return id.split('@')[0].split(':')[0];
        };
        
        // Normalize bot ID
        const botIdNormalized = normalizeId(client.user.id);
        console.log('Normalized Bot ID:', botIdNormalized);
        
        // Check if bot is admin
        let isBotAdmin = false;
        let isAdmin = false;
        
        for (const p of participants) {
            const participantIdNormalized = normalizeId(p.id);
            
            // Check if this is the bot
            if (participantIdNormalized === botIdNormalized) {
                isBotAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                console.log('Found bot in participants. Admin status:', p.admin, 'Result:', isBotAdmin);
            }
            
            // Check if this is the message sender
            if (participantIdNormalized === normalizeId(m.sender)) {
                isAdmin = p.admin === 'admin' || p.admin === true || p.admin === 'superadmin';
                console.log('Found sender in participants. Admin status:', p.admin, 'Result:', isAdmin);
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