const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, text, Owner } = context;

        if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Tag or mention a user to unblock.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';

        const parts = users.split('@')[0];

        await client.updateBlockStatus(users, 'unblock'); 
       await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ UNBLOCKED ≪───\n├ \n├ ${parts} is unblocked. Don't make\n├ me regret this.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`); 
    });
};
