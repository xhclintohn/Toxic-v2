const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, store } = context;

        if (!m?.chat) return;

        if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) {
            return m.reply('⚠️ Cannot archive this type of chat.');
        }

        let lastMessages;
        if (store?.chats?.[m.chat] && Array.isArray(store.chats[m.chat]) && store.chats[m.chat].length) {
            lastMessages = store.chats[m.chat].slice(-1);
        }

        try {
            await client.chatModify(
                {
                    archive: true,
                    lastMessages
                },
                m.chat
            );

            await m.reply(`✅ Chat archived.\n—\nTσxιƈ-ɱԃȥ`);
        } catch (err) {
            console.error('Archive chat failed:', err);
            await m.reply('⚠️ Failed to archive chat.');
        }
    });
};