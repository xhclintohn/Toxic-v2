const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getBannedUsers } = require('../../database/config');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { m } = context;

        const bannedUsers = await getBannedUsers();

        if (!bannedUsers || bannedUsers.length === 0) {
            return await m.reply(
                `╭───(    TOXIC-MD    )───\n` +
                `├───≫ BAN LIST ≪───\n` +
                `├ \n` +
                `├ There are no banned users at the moment.\n` +
                `╰──────────────────☉\n` +
                `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            );
        }

        const list = bannedUsers.map((num, index) => `├ ${index + 1}. ${num}`).join('\n');
        await m.reply(
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ BAN LIST ≪───\n` +
            `├ \n` +
            `${list}\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
    });
};
