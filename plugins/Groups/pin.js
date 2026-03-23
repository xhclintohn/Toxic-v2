const middleware = require('../../utils/botUtil/middleware');

module.exports = {
    name: 'pin',
    aliases: ['pinmsg', 'unpin'],
    description: 'Pin or unpin a message in a group',
    run: async (context) => {
        await middleware(context, async () => {
            const { client, m, args } = context;

            if (!m.quoted) {
                return m.reply('╭───(    TOXIC-MD    )───\n├───≥ PIN ≤───\n├ \n├ Quote a message to pin it,\n├ you absolute muppet.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }

            const isUnpin = (args[0] || '').toLowerCase() === 'unpin';

            const messageKey = {
                id: m.quoted.id,
                remoteJid: m.chat,
                participant: m.quoted.sender
            };

            try {
                await client.pinMessage(m.chat, messageKey, isUnpin ? 0 : 1);
                await m.reply(`╭───(    TOXIC-MD    )───\n├───≥ ${isUnpin ? 'UNPINNED' : 'PINNED'} ≤───\n├ \n├ Message ${isUnpin ? 'unpinned' : 'pinned'} successfully.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
            } catch (error) {
                await m.reply('╭───(    TOXIC-MD    )───\n├───≥ ERROR ≤───\n├ \n├ Failed to pin. Make sure I\'m admin.\n╰──────────────────☉\n> ©𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            }
        });
    }
};
