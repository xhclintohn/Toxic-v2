const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const newPrefix = args[0];

    const settings = await getSettings();

    if (newPrefix === 'null') {
      if (!settings.prefix) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Already prefixless, you clueless twit! 😈\n` +
          `│❒ Stop wasting my time! 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('prefix', '');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Prefix obliterated! 🔥\n` +
        `│❒ I’m prefixless now, bow down! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else if (newPrefix) {
      if (settings.prefix === newPrefix) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Prefix is already ${newPrefix}, moron! 😈\n` +
          `│❒ Try something new, fool! 🥶\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('prefix', newPrefix);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ New prefix set to ${newPrefix}! 🔥\n` +
        `│❒ Obey the new order, king! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Current Prefix: ${settings.prefix || 'No prefix, peasant! 🥶'}\n` +
        `│❒ Use "${settings.prefix || '.'}prefix null" to go prefixless or "${settings.prefix || '.'}prefix <symbol>" to set one, noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};