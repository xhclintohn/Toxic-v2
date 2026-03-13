const { getSettings, updateSetting } = require('../../database/config');
const ownerMiddleware = require('../../utils/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;

    const formatStylishReply = (title, message) => {
      return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
    };

    try {
      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("AUTOBIO", "Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();

      if (value === 'on' || value === 'off') {
        const action = value === 'on';
        if (settings.autobio === action) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply("AUTOBIO", `Autobio's already ${value.toUpperCase()}, you brain-dead fool! Stop wasting my time.`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('autobio', action);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("AUTOBIO", `Autobio ${value.toUpperCase()} activated! ${action ? 'Bot\'s flexing status updates every 10 seconds, bow down!' : 'No more status flexing, you\'re not worth it.'}`) },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}autobio on`, buttonText: { displayText: "ON" }, type: 1 },
        { buttonId: `${prefix}autobio off`, buttonText: { displayText: "OFF" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply("AUTOBIO", `Autobio's ${settings.autobio ? 'ON' : 'OFF'}, dumbass. Pick a vibe, noob!`),
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("AUTOBIO", "Shit broke, couldn't mess with autobio. Database or something's fucked. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};
