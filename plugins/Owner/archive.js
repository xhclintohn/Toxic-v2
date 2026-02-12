const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, store } = context;

        if (!m?.chat) return;

        if (m.chat.endsWith('@broadcast') || m.chat.endsWith('@newsletter')) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Cannot archive this type of chat.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
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

            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ARCHIVED ≪───\n├ \n├ Chat archived.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } catch (err) {
            console.error('Archive chat failed:', err);
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Failed to archive chat.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};
