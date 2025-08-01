const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args, prefix } = context;
    const value = args[0]?.toLowerCase();

    let settings = await getSettings();
    if (!settings) {
      return await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Yo, dumbass! 😈 Settings are screwed up!\n` +
        `│❒ Fix your database, moron! 🖕\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }

    let isEnabled = settings.antilink === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Antilink is already ${value.toUpperCase()}, you clueless twit! 🥶\n` +
          `│❒ Stop spamming, peasant! 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }

      await updateSettings('antilink', action);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Antilink ${value.toUpperCase()} globally! 🔥\n` +
        `│❒ Links in groups? Not on my watch, king! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Antilink Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${prefix}antilink on" or "${prefix}antilink off", noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};