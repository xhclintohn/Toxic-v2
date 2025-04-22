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

      if (value === 'on') {
        if (settings.autolike) {
          return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Autolike’s already ON, genius. Stop wasting my time.`);
        }
        await updateSetting('autolike', true);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Autolike’s ON now. Bot’s gonna like statuses like a simp.`);
      } else if (value === 'off') {
        if (!settings.autolike) {
          return await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Autolike’s already OFF, dipshit. What’s your deal?`);
        }
        await updateSetting('autolike', false);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Autolike’s OFF. No more fake love for statuses.`);
      } else {
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Autolike’s ${settings.autolike ? 'ON' : 'OFF'}, dumbass.\n\nUse ${prefix}autolike on or ${prefix}autolike off to change it.`);
      }
    } catch (error) {
      console.error('[Autolike] Error in command:', error);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, couldn’t mess with autolike. Database or something’s fucked. Try later.`);
    }
  });
};