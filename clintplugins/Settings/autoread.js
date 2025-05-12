const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();

    const settings = await getSettings();

    if (value === 'on') {
      if (settings.autoread) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Autoread is already ON, you clueless twit! 😈\n` +
          `│❒ I’m already reading everything! 🥶\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('autoread', 'true');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autoread ON! 🔥\n` +
        `│❒ I’ll read every message like a boss! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else if (value === 'off') {
      if (!settings.autoread) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Autoread is already OFF, moron! 😈\n` +
          `│❒ Stop wasting my time! 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('autoread', 'false');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autoread OFF! 💀\n` +
        `│❒ I’m done reading your trash.\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autoread Status: ${settings.autoread ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${settings.prefix}autoread on" or "${settings.prefix}autoread off", noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};