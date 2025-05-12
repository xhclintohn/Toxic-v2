const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args, prefix } = context;
    const value = args[0]?.toLowerCase();

    try {
      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Database is fucked, no settings found. Fix it, loser.`);
      }

      const validPresenceValues = ['online', 'offline', 'recording', 'typing'];

      if (validPresenceValues.includes(value)) {
        if (settings.presence === value) {
          return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Presence is already ${value.toUpperCase()}, genius. Stop wasting my time.`);
        }

        await updateSetting('presence', value);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Presence set to ${value.toUpperCase()}. Bot’s flexing that status now!`);
      } else {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Presence is ${settings.presence ? settings.presence.toUpperCase() : 'NONE'}, dumbass.\n\nUse ${prefix}presence online, ${prefix}presence offline, ${prefix}presence recording, or ${prefix}presence typing.`);
      }
    } catch (error) {
      console.error('[Presence] Error in command:', error);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, couldn’t update presence. Database or something’s fucked. Try later.`);
    }
  });
};