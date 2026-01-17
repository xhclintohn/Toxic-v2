const { getSettings } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━◈`;
};

module.exports = async (context) => {
    const { client, m, text, quoted } = context;
    
    if (!m.isGroup) return m.reply(formatStylishReply("Group only command idiot"));
    
    const isBotAdmin = m.isBotAdmin;
    if (!isBotAdmin) return m.reply(formatStylishReply("Make me admin first!"));
    
    const isAdmin = m.isAdmin;
    if (!isAdmin) return m.reply(formatStylishReply("You're not admin!"));
    
    let imageBuffer;
    
    if (quoted && quoted.mimetype && quoted.mimetype.startsWith('image/')) {
        try {
            imageBuffer = await quoted.download();
        } catch {
            return m.reply(formatStylishReply("Can't download image"));
        }
    }
    else if (m.message?.imageMessage) {
        try {
            imageBuffer = await m.download();
        } catch {
            return m.reply(formatStylishReply("Can't download image"));
        }
    }
    else {
        return m.reply(formatStylishReply("Send or reply with image"));
    }
    
    if (!imageBuffer) return m.reply(formatStylishReply("Invalid image"));
    
    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
        await client.updateProfilePicture(m.chat, imageBuffer);
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        return m.reply(formatStylishReply("Group picture updated ✅"));
    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(formatStylishReply("Failed to update picture"));
    }
};