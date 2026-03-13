const { getSettings } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

const formatStylishReply = (message) => {
    return `╭───(    TOXIC-MD    )───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
};

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, quoted, isBotAdmin, IsGroup } = context;
        
        if (!IsGroup) return m.reply(formatStylishReply("Group only command idiot"));
        
        if (!isBotAdmin) return m.reply(formatStylishReply("I need to be *admin* to change group picture. Please make me admin first."));
        
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
            return m.reply(formatStylishReply("Group picture updated"));
        } catch (error) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(formatStylishReply("Failed to update picture"));
        }
    });
};
