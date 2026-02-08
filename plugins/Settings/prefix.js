const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const newPrefix = args[0];

    const settings = await getSettings();

    if (newPrefix === 'null') {
      if (!settings.prefix) {
        return await m.reply(
          `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
          `> 々 Already prefixless, you clueless twit! 😈\n` +
          `> 々 Stop wasting my time! 🖕\n` +
          `╰──────────────────☉`
        );
      }
      await updateSetting('prefix', '');
      await m.reply(
        `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
        `> 々 Prefix obliterated! 🔥\n` +
        `> 々 I’m prefixless now, bow down! 😈\n` +
        `╰──────────────────☉`
      );
    } else if (newPrefix) {
      if (settings.prefix === newPrefix) {
        return await m.reply(
          `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
          `> 々 Prefix is already ${newPrefix}, moron! 😈\n` +
          `> 々 Try something new, fool! 🥶\n` +
          `╰──────────────────☉`
        );
      }
      await updateSetting('prefix', newPrefix);
      await m.reply(
        `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
        `> 々 New prefix set to ${newPrefix}! 🔥\n` +
        `> 々 Obey the new order, king! 😈\n` +
        `╰──────────────────☉`
      );
    } else {
      await m.reply(
        `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
        `> 々 Current Prefix: ${settings.prefix || 'No prefix, peasant! 🥶'}\n` +
        `> 々 Use "${settings.prefix || '.'}prefix null" to go prefixless or "${settings.prefix || '.'}prefix <symbol>" to set one, noob!\n` +
        `╰──────────────────☉`
      );
    }
  });
};