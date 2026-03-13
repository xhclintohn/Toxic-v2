const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getSudoUsers } = require('../../database/config');

module.exports = async (context) => {
  
    const { m } = context;

    const sudoUsers = await getSudoUsers();

    if (!sudoUsers || sudoUsers.length === 0) {
      return await m.reply("╭───(    TOXIC-MD    )───\n├ No Sudo Users found. You're all alone.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }

    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ SUDO USERS ≪───\n├ \n${sudoUsers.map((jid) => `├ ${jid}`).join('\n')}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
 
};
