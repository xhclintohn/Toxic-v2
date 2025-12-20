const { getSettings, updateSetting } = require('../Database/config');

module.exports = async (context) => {
  // Check if this is a command call or automatic call from index.js
  if (!context || typeof context !== 'object') {
    return; // Just return if called incorrectly
  }

  const { client, m, store, pict, args, prefix } = context;

  // If called from index.js (automatic), just return - don't process as command
  if (!args && !prefix) {
    return;
  }

  // If no message object, return
  if (!m || !m.key || !m.chat) {
    return;
  }

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
  };

  try {
    const settings = await getSettings();
    if (!settings || Object.keys(settings).length === 0) {
      return await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Database is fucked, no settings found. Fix it, loser.") },
        { quoted: m, ad: true }
      );
    }

    const value = args?.join(" ")?.toLowerCase() || '';

    if (value === 'on' || value === 'off') {
      const action = value === 'on';
      if (settings.antidelete === action) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`Antidelete’s already ${value.toUpperCase()}, you brain-dead fool! Stop wasting my time. 😈`) },
          { quoted: m, ad: true }
        );
      }

      await updateSetting('antidelete', action);
      return await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`Antidelete ${value.toUpperCase()} activated! 🔥 ${action ? 'No one’s erasing shit on my watch, king! 🦁' : 'Deletions are free to slide, you’re not worth catching. 😴'}`) },
        { quoted: m, ad: true }
      );
    }

    const buttons = [
      { buttonId: `${prefix || '.'}antidelete on`, buttonText: { displayText: "ON 🦁" }, type: 1 },
      { buttonId: `${prefix || '.'}antidelete off`, buttonText: { displayText: "OFF 😴" }, type: 1 },
    ];

    await client.sendMessage(
      m.chat,
      {
        text: formatStylishReply(`Antidelete’s ${settings.antidelete ? 'ON 🦁' : 'OFF 😴'}, dumbass. Pick a vibe, noob! 😈`),
        footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
        buttons,
        headerType: 1,
        viewOnce: true,
      },
      { quoted: m, ad: true }
    );
  } catch (error) {
    console.error('Antidelete error:', error);
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply("Shit broke, couldn't mess with antidelete. Database or something's fucked. Try later.") },
      { quoted: m, ad: true }
    );
  }
};