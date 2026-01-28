const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'fullpp',
    async execute(socket, msg, number) {
        const owner = '254735342808';
        const botNum = jidNormalizedUser(socket.user.id).split('@')[0];
        if (number !== owner && number !== botNum) return;

        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted || !quoted.imageMessage) return socket.sendMessage(msg.key.remoteJid, { text: "REPLY TO A FUCKING IMAGE!" });

        try {
            const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) { buffer = Buffer.concat([buffer, chunk]); }

            await socket.query({
                tag: 'iq',
                attrs: { to: jidNormalizedUser(socket.user.id), type: 'set', xmlns: 'w:profile:picture' },
                content: [{ tag: 'picture', attrs: { type: 'image' }, content: buffer }]
            });

            await socket.sendMessage(msg.key.remoteJid, { text: "✅ *Bot Profile Picture Updated. Looking sharp.*" });
        } catch (e) {
            await socket.sendMessage(msg.key.remoteJid, { text: `Error: ${e.message}` });
        }
    }
};
