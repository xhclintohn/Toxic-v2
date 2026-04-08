const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
    await ownerMiddleware(context, async () => {
        const { client, m } = context;
        await client.sendMessage(m.chat, { react: { text: '🔄', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ RESTART ≪───\n├ \n├ Restarting Toxic-MD...\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        setTimeout(() => { process.exit(0); }, 3000);
    });
};
