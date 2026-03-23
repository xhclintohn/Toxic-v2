const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = {
    name: 'clear',
    aliases: ['clearchat', 'wipe'],
    description: 'Clears all messages in a chat from the bot view',
    run: async (context) => {
        await ownerMiddleware(context, async () => {
            const { client, m } = context;

            try {
                await client.clearChatMessages(m.chat, m);
                await m.reply('╭───(    TOXIC-MD    )───\n├───≥ CLEARED ≤───\n├ \n├ Chat cleared from my view.\n├ Gone. All of it. 🧹\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            } catch (error) {
                await m.reply('╭───(    TOXIC-MD    )───\n├───≥ ERROR ≤───\n├ \n├ Couldn\'t clear this chat.\n├ Try again, genius.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }
        });
    }
};
