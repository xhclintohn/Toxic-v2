const { getSettings, getGroupSetting, updateGroupSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { m, args } = context;
    const value = args[0]?.toLowerCase();
    const jid = m.chat;

    if (!jid.endsWith('@g.us')) {
      return await m.reply(
        `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
        `々 Nice try, idiot! 😈\n` +
        `々 This command is for groups only, you moron!\n` +
        `╭───( ✓ )───`
      );
    }

    const settings = await getSettings();
    const prefix = settings.prefix;

    let groupSettings = await getGroupSetting(jid);
    let isEnabled = groupSettings?.antipromote === true;

    if (value === 'on' || value === 'off') {
      const action = value === 'on';

      if (isEnabled === action) {
        return await m.reply(
          `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
          `々 Antipromote is already ${value.toUpperCase()}, you clueless moron! 🥶\n` +
          `々 Stop spamming my commands! 🖕\n` +
          `╭───( ✓ )───`
        );
      }

      await updateGroupSetting(jid, 'antipromote', action ? 'true' : 'false');
      await m.reply(
        `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
        `々 Antipromote ${value.toUpperCase()}! 🔥\n` +
        `々 Promotions are under my control, king! 😈\n` +
        `╭───( ✓ )───`
      );
    } else {
      await m.reply(
        `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n` +
        `々 Antipromote Status: ${isEnabled ? 'ON 🥶' : 'OFF 😴'}\n` +
        `々 Use "${prefix}antipromote on" or "${prefix}antipromote off", fool!\n` +
        `╭───( ✓ )───`
      );
    }
  });
};