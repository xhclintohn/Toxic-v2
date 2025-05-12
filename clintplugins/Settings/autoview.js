const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();

    const settings = await getSettings();

    if (value === 'on') {
      if (settings.autoview) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Autoview is already ON, you brainless fool! 😈\n` +
          `│❒ I’m already watching every status! 🥶\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('autoview', 'true');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autoview ON! 🔥\n` +
        `│❒ I’ll view every status like a king! 😈\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else if (value === 'off') {
      if (!settings.autoview) {
        return await m.reply(
          `◈━━━━━━━━━━━━━━━━◈\n` +
          `│❒ Autoview is already OFF, moron! 😈\n` +
          `│❒ Quit spamming my commands! 🖕\n` +
          `┗━━━━━━━━━━━━━━━┛`
        );
      }
      await updateSetting('autoview', 'false');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autoview OFF! 💀\n` +
        `│❒ I’m done with your boring statuses.\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    } else {
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Autoview Status: ${settings.autoview ? 'ON 🥶' : 'OFF 😴'}\n` +
        `│❒ Use "${settings.prefix}autoview on" or "${settings.prefix}autoview off", noob!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }
  });
};