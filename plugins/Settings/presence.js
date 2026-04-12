const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;
    const fq = getFakeQuoted(m);

    const formatStylishReply = (message) => {
      return `╭───(    TOXIC-MD    )───\n├ ${message}\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    try {
      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Database is fucked, no settings found. Fix it, loser.") },
          { quoted: fq, ad: true }
        );
      }

      const validPresenceValues = ['online', 'offline', 'recording', 'typing'];
      const value = args.join(" ").toLowerCase();

      if (validPresenceValues.includes(value)) {
        if (settings.presence === value) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`Presence is already ${value.toUpperCase()}, genius. Stop wasting my time.`) },
            { quoted: fq, ad: true }
          );
        }

        await updateSetting('presence', value);
        await client.sendMessage(m.chat, { react: { text: '⚙️', key: m.key } });
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`Presence set to ${value.toUpperCase()}. Bot’s flexing that status now!`) },
          { quoted: fq, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}presence online`, buttonText: { displayText: "ONLINE 🟢" }, type: 1 },
        { buttonId: `${prefix}presence offline`, buttonText: { displayText: "OFFLINE ⚫" }, type: 1 },
        { buttonId: `${prefix}presence recording`, buttonText: { displayText: "RECORDING 🎙️" }, type: 1 },
        { buttonId: `${prefix}presence typing`, buttonText: { displayText: "TYPING ⌨️" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply(`Presence is ${settings.presence ? settings.presence.toUpperCase() : 'NONE'}. Pick a vibe, fam! 🔥`),
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: fq, ad: true }
      );
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Shit broke, couldn’t update presence. Database or something’s fucked. Try later.") },
        { quoted: fq, ad: true }
      );
    }
  });
};