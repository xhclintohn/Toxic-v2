const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text } = context;

        let users;

        if (m.mentionedJid && m.mentionedJid.length > 0) {
            users = m.mentionedJid[0];
        } else if (m.quoted && m.quoted.sender) {
            users = m.quoted.sender;
        } else if (text && text.replace(/[^0-9]/g, '')) {
            users = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
            return m.reply(`╭───(    TOXIC-MD    )───
├ 
├ Tag or reply to a user to block.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        if (typeof users === 'string' && users.endsWith('@lid')) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Can't resolve that user's number.\n├ Quote their message instead.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
        const blockJid = (users || '').includes('@') ? users.split(':')[0].split('@')[0] + '@s.whatsapp.net' : users + '@s.whatsapp.net';
        try {
            await client.updateBlockStatus(blockJid, 'block');
            const parts = blockJid.split('@')[0];

            return m.reply(`╭───(    TOXIC-MD    )───
├───≫ BLOCKED ≪───
├ 
├ ${parts} is blocked. Good riddance.
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        } catch (e) {
            console.error('BLOCK ERROR:', e);
            return m.reply(`╭───(    TOXIC-MD    )───
├ 
├ Failed to block that user.
├ ${e?.message || 'Unknown error'}
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    });
};