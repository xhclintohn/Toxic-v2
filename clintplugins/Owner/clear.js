const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

async function getLastMessageInChat(client, jid) {
    const messages = await client.loadMessages(jid, 1);
    return messages[0] || null;
}

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;
        
        let targetJid = m.chat;
        
        if (text) {
            const phoneNumberMatch = text.match(/[\s\+]*(\d{10,15})/);
            if (phoneNumberMatch) {
                const rawNumber = phoneNumberMatch[1];
                const cleanNumber = rawNumber.replace(/[^\d]/g, '');
                
                if (cleanNumber.length >= 10 && cleanNumber.length <= 15) {
                    const countryCode = cleanNumber.startsWith('0') ? '62' : '';
                    const formattedNumber = countryCode + cleanNumber.replace(/^0/, '');
                    targetJid = formattedNumber + '@s.whatsapp.net';
                }
            }
        }
        
        const lastMsg = await getLastMessageInChat(client, targetJid);
        if (!lastMsg) return m.reply("No messages found to clear.");
        
        await client.chatModify({
            delete: true,
            lastMessages: [{
                key: lastMsg.key,
                messageTimestamp: lastMsg.messageTimestamp
            }]
        }, targetJid);
        
        await m.reply(`✅ Chat cleared ${targetJid !== m.chat ? 'remotely' : ''}.\n—\nTσxιƈ-ɱԃȥ`);
    });
};