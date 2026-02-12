const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SHUTDOWN ≪───\n├ \n├ Toxic-MD shutting down...\n├ Bot will be offline.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        const { exec } = require('child_process');
        exec('heroku ps:scale web=0', (error) => {
            if (error) m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Shutdown failed. Manual scale required.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        });
        setTimeout(() => { process.exit(1); }, 3000);
    });
};
