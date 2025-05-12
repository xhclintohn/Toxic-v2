const { updateSetting, getSettings } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();

    const settings = await getSettings();
    const prefix = settings.prefix;

    if (value === 'public' || value === 'private') {
      if (settings.mode === value) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Yo, moron! 😈 Bot is already in ${value.toUpperCase()} mode!\n` +
          `│❒ Stop wasting my time, peasant! 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('mode', value);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Bot mode set to ${value.toUpperCase()}! 🔥\n` +
        `│❒ Bow to the king, I rule now! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Current Mode: ${settings.mode || 'Undefined, you noob! 🥶'}\n` +
        `│❒ Use "${prefix}mode public" or "${prefix}mode private", fool!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};