const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, participants, isAdmin } = context;
        
        if (!isAdmin) {
            return m.reply("You think you're admin? Your delusion is amusing.");
        }
        
        await client.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
        await m.reply("⚠️ *FINAL WARNING: GROUP PURGE INITIATED*\n\nThis action is irreversible. All members will be removed. The group will be renamed.\n\nExecution commencing...");
        
        const groupMembers = participants.filter(p => p.id !== m.sender && p.id !== client.user.id.split(':')[0] + '@s.whatsapp.net');
        
        for (const member of groupMembers) {
            try {
                await client.groupParticipantsUpdate(m.chat, [member.id], 'remove');
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {}
        }
        
        try {
            await client.groupUpdateSubject(m.chat, "Proven Useless🦄🚮");
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch {}
        
        try {
            await client.groupUpdateDescription(m.chat, "A testament to collective failure. Your presence here was a mistake we have corrected.");
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch {}
        
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply("✅ *PURGE COMPLETE*\n\nAll members removed. Group renamed. The monument to your worthlessness stands.\n—\nTσxιƈ-ɱԃȥ");
    });
};