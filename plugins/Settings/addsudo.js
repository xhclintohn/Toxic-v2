const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getSudoUsers, addSudoUser } = require('../../database/config');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;

    let numberToAdd;

    if (m.quoted) {
      numberToAdd = m.quoted.sender.split('@')[0];
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
      numberToAdd = m.mentionedJid[0].split('@')[0];
    } else {
      numberToAdd = args[0];
    }

    if (!numberToAdd || !/^\d+$/.test(numberToAdd)) {
      return await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ADD SUDO ≪───\n` +
        `├ \n` +
        `├ Pathetic attempt, moron!\n` +
        `├ Give me a valid number or quote a user, fool!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }

    const sudoUsers = await getSudoUsers();
    if (sudoUsers.includes(numberToAdd)) {
      return await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ADD SUDO ≪───\n` +
        `├ \n` +
        `├ Already a sudo user, you clueless twit!\n` +
        `├ ${numberToAdd} is already in the elite ranks.\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }

    await addSudoUser(numberToAdd);
    await m.reply(
      `╭───(    TOXIC-MD    )───\n` +
      `├───≫ ADD SUDO ≪───\n` +
      `├ \n` +
      `├ Bow down!\n` +
      `├ ${numberToAdd} is now a Sudo King!\n` +
      `╰──────────────────☉\n` +
      `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
    );
  });
};
