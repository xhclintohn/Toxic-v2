const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;

        if (!m?.chat) return;

        // Avoid weird system / broadcast chats (optional but safer)
        if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) {
            return m.reply('⚠️ Cannot clear this type of chat.');
        }

        try {
            // Clear chat on bot session only
            await client.chatModify({ clear: true }, m.chat);

            await m.reply(`✅ Chat cleared on my side.\n—\nTσxιƈ-ɱԃȥ`);
        } catch (err) {
            console.error('Clear chat failed:', err);
            await m.reply('⚠️ Failed to clear chat on my side.');
        }
    });
};