const middleware = require('../../utility/botUtil/middleware');

module.exports = async (context) => {
    await middleware(context, async () => {
        const { client, m, participants, text } = context;

        if (!m.isGroup) {
            return client.sendMessage(
                m.chat,
                { text: '◈━━━━━━━━━━━━━━━━◈\n❒ Command meant for groups.\n◈━━━━━━━━━━━━━━━━◈' },
                { quoted: m }
            );
        }

        try {
            const mentions = participants.map(a => a.id);
            const txt = [
                `◈━━━━━━━━━━━━━━━━◈`,
                `❒ You have been tagged by ${m.pushName}.`,
                `  Message: ${text ? text : 'No Message!'}`,
                '',
                ...mentions.map(id => `📧 @${id.split('@')[0]}`),
                `◈━━━━━━━━━━━━━━━━◈`
            ].join('\n');

            await client.sendMessage(
                m.chat,
                { text: txt, mentions },
                { quoted: m }
            );
        } catch (error) {
            console.error(`Tagall error: ${error.message}`);
            await client.sendMessage(
                m.chat,
                { text: '◈━━━━━━━━━━━━━━━━◈\n❒ Failed to tag participants. Try again later.\n◈━━━━━━━━━━━━━━━━◈' },
                { quoted: m }
            );
        }
    });
};