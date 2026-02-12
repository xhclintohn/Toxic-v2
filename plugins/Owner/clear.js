const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, store } = context;

        if (!m?.chat) return;

     
        if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Cannot clear this type of chat.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
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

            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ CLEARED ≪───\n├ \n├ Chat cleared.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } catch (err) {
            console.error('Clear chat failed:', err);
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to clear chat.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
