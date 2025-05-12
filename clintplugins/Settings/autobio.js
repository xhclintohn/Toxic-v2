const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();

    const settings = await getSettings();
    const prefix = settings.prefix;
    const isEnabled = settings.autobio === true;

    if (value === 'on') {
      if (isEnabled) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Autobio is already ON, you brain-dead fool! 😈\n` +
          `│❒ My status is already flexing! 🥶\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('autobio', 'true');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autobio ON! 🔥\n` +
        `│❒ My status will update every 10 seconds, bow down! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else if (value === 'off') {
      if (!isEnabled) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Autobio is already OFF, moron! 😈\n` +
          `│❒ Why you wasting my time? 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('autobio', 'false');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autobio OFF! 💀\n` +
        `│❒ No more status flexing for now.\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autobio Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${prefix}autobio on" or "${prefix}autobio off", you noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};