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
          { text: formatStylishReply("AUTOREAD", "Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();

      if (value === 'on' || value === 'off') {
        const action = value === 'on';
        if (settings.autoread === action) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply("AUTOREAD", `Autoread message already ${value.toUpperCase()}, genius. Stop wasting my time.`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('autoread', action);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("AUTOREAD", `Autoread ${value.toUpperCase()} activated! ${action ? 'Bot\'s reading every message like a creep.' : 'No more spying on your trash messages.'}`) },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}autoread on`, buttonText: { displayText: "ON" }, type: 1 },
        { buttonId: `${prefix}autoread off`, buttonText: { displayText: "OFF" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply("AUTOREAD", `Autoread's ${settings.autoread ? 'ON' : 'OFF'}, dumbass. Pick a vibe, noob!`),
          footer: "> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧",
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("AUTOREAD", "Shit broke, couldn't mess with autoread. Database or something's fucked. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};
