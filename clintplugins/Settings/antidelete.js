const { getSettings, getGroupSetting, updateGroupSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    if (!jid.endsWith('@g.us')) {
      return await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Dumb move, moron! 😈\n` +
        `│❒ This command is for groups only, you fool!\n` +
        `┗━━━━━━━━━━━━━━━┛`
      );
    }

    const settings = await getSettings();
    const prefix = settings.prefix;

    let groupSettings = await getGroupSetting(jid);
    let isEnabled = groupSettings?.antidelete === true;

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

      await updateGroupSetting(jid, 'antidelete', action ? 'true' : 'false');
      await m.reply(
        `◈━━━━━━━━━━━━━━━━◈\n` +
        `│❒ Antidelete ${value.toUpperCase()}! 🔥\n` +
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