const { getSettings, updateSettings } = require('../../Database/config');
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

    let isEnabled = settings.antidelete === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Antidelete is already ${value.toUpperCase()}, you clueless twit! 🥶\n` +
          `│❒ Stop spamming, peasant! 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }

      await updateSettings('antidelete', action);
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Antidelete ${value.toUpperCase()} globally! 🔥\n` +
        `│❒ Deleted messages will be sent to your inbox, king! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Antidelete Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${prefix}antidelete on" or "${prefix}antidelete off", noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};