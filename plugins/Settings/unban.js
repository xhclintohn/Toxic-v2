const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getBannedUsers, unbanUser } = require('../../database/config');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;

        let numberToUnban;

        if (m.quoted) {
            numberToUnban = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            numberToUnban = m.mentionedJid[0];
        } else {
            numberToUnban = args[0];
        }

        if (!numberToUnban) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ Provide a valid number or quote a user, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

       
        numberToUnban = numberToUnban.replace('@s.whatsapp.net', '').trim();

        const bannedUsers = await getBannedUsers();

        if (!bannedUsers.includes(numberToUnban)) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ This user wasn't even banned. What are you doing?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        await unbanUser(numberToUnban);
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ UNBAN ≪───\n├ \n├ ${numberToUnban} has been unbanned.\n├ They better not mess up again.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
