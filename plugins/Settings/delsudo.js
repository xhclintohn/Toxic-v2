const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getSettings, getSudoUsers, removeSudoUser } = require('../../database/config');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m, args } = context;

        let numberToRemove;

        if (m.quoted) {
            numberToRemove = m.quoted.sender.split('@')[0];
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            numberToRemove = m.mentionedJid[0].split('@')[0];
        } else {
            numberToRemove = args[0];
        }

        if (!numberToRemove || !/^\d+$/.test(numberToRemove)) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ Provide a valid number or quote a user, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const settings = await getSettings();
        if (!settings) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ Settings not found. Something's seriously broken.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const sudoUsers = await getSudoUsers();

        if (!sudoUsers.includes(numberToRemove)) {
            return await m.reply("╭───(    TOXIC-MD    )───\n├ This number isn't even a sudo user, idiot.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

      
        await removeSudoUser(numberToRemove);
        await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ DELSUDO ≪───\n├ \n├ ${numberToRemove} removed from Sudo Users.\n├ Power revoked. Sucks to be them.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    });
};
