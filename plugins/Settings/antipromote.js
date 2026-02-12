const { getSettings, getGroupSetting, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    if (!jid.endsWith('@g.us')) {
      return await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIPROMOTE ≪───\n` +
        `├ \n` +
        `├ Nice try, idiot!\n` +
        `├ This command is for groups only, you moron!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }

    const settings = await getSettings();
    const prefix = settings.prefix;

    let groupSettings = await getGroupSetting(jid);
    let isEnabled = groupSettings?.antipromote === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├───≫ ANTIPROMOTE ≪───\n` +
          `├ \n` +
          `├ Antipromote is already ${value.toUpperCase()}, you clueless moron!\n` +
          `├ Stop spamming my commands!\n` +
          `╰──────────────────☉\n` +
          `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }

      await updateGroupSetting(jid, 'antipromote', action ? 'true' : 'false');
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIPROMOTE ≪───\n` +
        `├ \n` +
        `├ Antipromote ${value.toUpperCase()}!\n` +
        `├ Promotions are under my control, king!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    } else {
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├───≫ ANTIPROMOTE ≪───\n` +
        `├ \n` +
        `├ Antipromote Status: ${isEnabled ? 'ON' : 'OFF'}\n` +
        `├ Use "${prefix}antipromote on" or "${prefix}antipromote off", fool!\n` +
        `╰──────────────────☉\n` +
        `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }
  });
};
