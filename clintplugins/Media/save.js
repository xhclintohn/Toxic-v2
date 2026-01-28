module.exports = {
    name: 'save',
    async execute(socket, msg) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const remoteJid = msg.key.remoteJid;

        const fakevcard = {
            key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net", fromMe: false, id: "TOXIC_SAVE_ID" },
            message: { contactMessage: { displayName: "Toxic-Mini-Bot", vcard: `BEGIN:VCARD\nVERSION:3.0\nN:Toxic;;;;\nFN:Toxic-Mini-Bot\nTEL;type=CELL;type=VOICE;waid=254735342808:+254 735 342 808\nEND:VCARD` } }
        };

        if (!quoted) return socket.sendMessage(remoteJid, { text: "Reply to a status/media first, you genius." }, { quoted: fakevcard });

        try {
            await socket.sendMessage(remoteJid, { forward: msg.message.extendedTextMessage.contextInfo.quotedMessage }, { quoted: msg });
            await socket.sendMessage(remoteJid, { text: "✅ *Media Saved Successfully*" }, { quoted: fakevcard });
        } catch (e) {
            await socket.sendMessage(remoteJid, { text: "Failed to save. Even the status doesn't like you." }, { quoted: fakevcard });
        }
    }
};
