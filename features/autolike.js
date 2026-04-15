const { getCachedSettingsSync } = require('../lib/settingsCache');

  const _EMOJIS = ['❤️','🔥','😂','😍','👏','🥰','💯','😭','🤣','🙏','👌','💪','🤩','😎','🥳','✨','💀','🤯','😤','💅','👀','🎉','😈','🤫','🫶'];

  async function autolike(client, message) {
    try {
      const { key, message: msg } = message;
      const remoteJid = key.remoteJid;
      if (remoteJid !== 'status@broadcast' || !key.id || msg?.protocolMessage) return;
      const settings = getCachedSettingsSync() || {};
      const configuredEmoji = settings.autolikeemoji;
      let emoji;
      if (!configuredEmoji || configuredEmoji === 'random') {
        emoji = _EMOJIS[Math.floor(Math.random() * _EMOJIS.length)];
      } else {
        emoji = configuredEmoji;
      }
      await client.sendMessage(remoteJid, { react: { key, text: emoji } });
      await client.readMessages([key]);
    } catch {}
  }

  module.exports = autolike;
  