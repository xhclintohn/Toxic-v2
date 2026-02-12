const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const newPrefix = args[0];

    const settings = await getSettings();

    if (newPrefix === 'null') {
      if (!settings.prefix) {
        return await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├ Already prefixless, you clueless twit! 😈\n` +
          `├ Stop wasting my time! 🖕\n` +
          `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }
      await updateSetting('prefix', '');
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├ Prefix obliterated! 🔥\n` +
        `├ I’m prefixless now, bow down! 😈\n` +
        `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    } else if (newPrefix) {
      if (settings.prefix === newPrefix) {
        return await m.reply(
          `╭───(    TOXIC-MD    )───\n` +
          `├ Prefix is already ${newPrefix}, moron! 😈\n` +
          `├ Try something new, fool! 🥶\n` +
          `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        );
      }
      await updateSetting('prefix', newPrefix);
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├ New prefix set to ${newPrefix}! 🔥\n` +
        `├ Obey the new order, king! 😈\n` +
        `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    } else {
      await m.reply(
        `╭───(    TOXIC-MD    )───\n` +
        `├ Current Prefix: ${settings.prefix || 'No prefix, peasant! 🥶'}\n` +
        `├ Use "${settings.prefix || '.'}prefix null" to go prefixless or "${settings.prefix || '.'}prefix <symbol>" to set one, noob!\n` +
        `╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      );
    }
  });
};