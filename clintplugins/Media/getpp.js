module.exports = {
    name: 'getpp',
    async execute(socket, msg) {
        let target = msg.key.remoteJid;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        }

        try {
            const ppUrl = await socket.profilePictureUrl(target, 'image').catch(() => 'https://raw.githubusercontent.com/xhclintohn/Music-Clips-Collection/main/mini.png');
            const name = target.split('@')[0];

            await socket.sendMessage(msg.key.remoteJid, {
                image: { url: ppUrl },
                caption: `*👤 Target:* @${name}\n*—*\n*Tσxιƈ-ɱԃȥ*`,
                mentions: [target]
            }, { quoted: msg });
        } catch (e) {
            await socket.sendMessage(msg.key.remoteJid, { text: "Failed to fetch. Privacy settings are stricter than your brain cells." });
        }
    }
};
