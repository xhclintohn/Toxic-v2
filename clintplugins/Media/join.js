// join.js
module.exports = {
    name: 'join',
    async execute(socket, msg, number) {
        const owner = '254735342808';
        if (number !== owner && number !== (socket.user.id.split(':')[0])) return;

        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
        const args = text.split(' ');
        const link = args[1] || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;

        if (!link || !link.includes('chat.whatsapp.com')) return socket.sendMessage(msg.key.remoteJid, { text: "Where is the link? My eyes aren't as bad as your logic." });

        try {
            const code = link.split('chat.whatsapp.com/')[1];
            await socket.groupAcceptInvite(code);
            await socket.sendMessage(msg.key.remoteJid, { text: "✅ Successfully joined the chaos." });
        } catch (e) {
            await socket.sendMessage(msg.key.remoteJid, { text: "Failed to join. Maybe I'm banned or the link is dead." });
        }
    }
};
