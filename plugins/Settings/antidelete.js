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
          { text: formatStylishReply("ANTIDELETE", "Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();

      if (value === 'on' || value === 'off') {
        const action = value === 'on';
        if (settings.antidelete === action) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply("ANTIDELETE", `Antidelete's already ${value.toUpperCase()}, you brain-dead fool! Stop wasting my time.`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('antidelete', action);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("ANTIDELETE", `Antidelete ${value.toUpperCase()} activated! ${action ? 'No one\'s erasing shit on my watch, king!' : 'Deletions are free to slide, you\'re not worth catching.'}`) },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}antidelete on`, buttonText: { displayText: "ON" }, type: 1 },
        { buttonId: `${prefix}antidelete off`, buttonText: { displayText: "OFF" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply("ANTIDELETE", `Antidelete's ${settings.antidelete ? 'ON' : 'OFF'}, dumbass. Pick a vibe, noob!`),
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("ANTIDELETE", "Shit broke, couldn't mess with antidelete. Database or something's fucked. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};
