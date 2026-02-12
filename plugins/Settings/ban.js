const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getSettings, banUser, getBannedUsers, getSudoUsers } = require('../../database/config');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m, args } = context;

        let settings = await getSettings();
        if (!settings) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ BAN ≪───\n` +
                `├ \n` +
                `├ Settings not found, you broke something.\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        const sudoUsers = await getSudoUsers();
        

        let numberToBan;

        if (m.quoted) {
            numberToBan = m.quoted.sender;
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            numberToBan = m.mentionedJid[0];
        } else {
            numberToBan = args[0];
        }

        if (!numberToBan) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ BAN ≪───\n` +
                `├ \n` +
                `├ Please provide a valid number or quote a user, moron.\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

      
        if (numberToBan.includes('@s.whatsapp.net')) {
            numberToBan = numberToBan.split('@')[0];
        }

        

        if (sudoUsers.includes(numberToBan)) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ BAN ≪───\n` +
                `├ \n` +
                `├ You cannot ban a Sudo User, you absolute fool!\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        const bannedUsers = await getBannedUsers();

        if (bannedUsers.includes(numberToBan)) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ BAN ≪───\n` +
                `├ \n` +
                `├ This user is already banned, genius.\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        await banUser(numberToBan);
        await m.reply(
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ BAN ≪───\n` +
            `├ \n` +
            `├ ${numberToBan} has been banned. Get wrecked!\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
    });
};
