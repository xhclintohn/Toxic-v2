const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();

    let settings = await getSettings();
    const prefix = settings.prefix;
    let isEnabled = settings.anticall === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Yo, genius! 😈 Anticall is already ${value.toUpperCase()}!\n` +
          `│❒ Stop wasting my time, moron. 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }

      await updateSetting('anticall', action ? true : false);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Anticall ${value.toUpperCase()} activated! 🔥\n` +
        `│❒ Callers will get wrecked! 💀\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Anticall Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${prefix}anticall on" or "${prefix}anticall off", you noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};