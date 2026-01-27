const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, store } = context;

        if (!m?.chat) return;

     
        if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) {
            return m.reply('⚠️ Cannot clear this type of chat.');
        }

        try {
           
            let lastMessages;
            if (store?.chats?.[m.chat] && Array.isArray(store.chats[m.chat]) && store.chats[m.chat].length) {
                lastMessages = store.chats[m.chat].slice(-1);
            }

            await client.chatModify(
                {
                    delete: true,
                    lastMessages
                },
                m.chat
            );

            await m.reply(`✅ Chat cleared.\n—\nTσxιƈ-ɱԃȥ`);
        } catch (err) {
            console.error('Clear chat failed:', err);
            await m.reply('⚠️ Failed to clear chat.');
        }
    });
};