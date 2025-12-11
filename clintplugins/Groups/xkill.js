const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, participants } = context;
        await client.sendMessage(m.chat, { react: { text: '⚠️', key: m.key } });
        await m.reply("⚠️ *FINAL WARNING: GROUP KILL COMMAND INITIATED*\n\nThis action is irreversible. All members including admins will be removed. The group will be renamed to 'Proven Useless🦄🚮' with an appropriate description.\n\nExecution commencing...");
        
        const groupMembers = participants.filter(p => !p.isAdmin && p.id !== m.sender);
        const adminMembers = participants.filter(p => p.isAdmin && p.id !== m.sender);
        
        for (const member of groupMembers) {
            try {
                await client.groupParticipantsUpdate(m.chat, [member.id], 'remove');
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch {}
        }
        
        for (const admin of adminMembers) {
            try {
                await client.groupParticipantsUpdate(m.chat, [admin.id], 'remove');
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch {}
        }
        
        await client.groupUpdateSubject(m.chat, "Proven Useless🦄🚮");
        await client.groupUpdateDescription(m.chat, "A collection of digital disappointments. Your contributions were as valuable as your existence—negligible.");
        
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply("✅ *GROUP PURGE COMPLETE*\n\nAll members removed. Group renamed. Your digital graveyard is ready.\n—\nTσxιƈ-ɱԃȥ");
    });
};