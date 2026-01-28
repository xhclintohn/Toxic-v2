module.exports = {
    name: 'leave',
    async execute(socket, msg, number) {
        const owner = '254735342808';
        if (number !== owner && number !== (socket.user.id.split(':')[0])) return;
        if (!msg.key.remoteJid.endsWith('@g.us')) return socket.sendMessage(msg.key.remoteJid, { text: "This isn't a group, Einstein." });

        await socket.sendMessage(msg.key.remoteJid, { text: "Goodbye losers! Toxic-Mini-Bot is out. ✌️" });
        await socket.groupLeave(msg.key.remoteJid);
    }
};
