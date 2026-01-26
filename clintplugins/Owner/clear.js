const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;

        if (!m || !m.chat) return;

        await client.chatModify({ clear: true }, m.chat);
        
        await m.reply(`✅ Chat cleared.\n—\nTσxιƈ-ɱԃȥ`);
    });
};