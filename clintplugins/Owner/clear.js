const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, store } = context;

        if (!m?.chat) return;

        // Optional: skip weird chats
        if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) {
            return m.reply('⚠️ Cannot clear this type of chat.');
        }

        try {
            // Try to provide lastMessages if you have a store (optional, but cleaner)
            let lastMessages;
            if (store?.chats?.[m.chat] && Array.isArray(store.chats[m.chat]) && store.chats[m.chat].length) {
                lastMessages = store.chats[m.chat].slice(-1); // last message only
            }

            await client.chatModify(
                {
                    delete: true,
                    lastMessages // can be undefined, Baileys handles it
                },
                m.chat
            );

            await m.reply(`✅ Chat cleared on my side.\n—\nTσxιƈ-ɱԃȥ`);
        } catch (err) {
            console.error('Clear chat failed:', err);
            await m.reply('⚠️ Failed to clear chat on my side.');
        }
    });
};