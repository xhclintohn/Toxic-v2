const { getSettings, updateSetting } = require('../Database/config');

module.exports = async (context) => {
  const { client, m, args, settings } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
  };

  if (!m.key.fromMe) {
    return await m.reply(formatStylishReply("Only the bot owner can toggle antidelete, loser! 🖕"));
  }

  const subCommand = args[0]?.toLowerCase();

  if (subCommand === 'status') {
    const isEnabled = settings.antidelete;
    return await m.reply(formatStylishReply(
      `🔍 *Anti-Delete Status*\n\n` +
      `• Enabled: ${isEnabled ? '✅ Yes' : '❌ No'}\n` +
      `• Forwards to: Bot's DM`
    ));
  }

  const newState = !settings.antidelete;
  await updateSetting('antidelete', newState);
  await m.reply(formatStylishReply(`Antidelete ${newState ? 'ENABLED' : 'DISABLED'} globally! ${newState ? 'Deleted messages will be forwarded to my DM! 🔒' : 'No more snooping on deletes, you rebel! 😎'}`));
};