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
          { text: formatStylishReply("ANTIEDIT", "Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();

      if (value === 'on' || value === 'off') {
        const action = value === 'on';
        if (settings.antiedit === action) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply("ANTIEDIT", `Antiedit's already ${value.toUpperCase()}, you brain-dead fool! Stop wasting my time.`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('antiedit', action);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("ANTIEDIT", `Antiedit ${value.toUpperCase()} activated! ${action ? 'Every sneaky edit gets caught now. No hiding.' : 'Edits fly under the radar. Your loss.'}`) },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}antiedit on`, buttonText: { displayText: "ON" }, type: 1 },
        { buttonId: `${prefix}antiedit off`, buttonText: { displayText: "OFF" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply("ANTIEDIT", `Antiedit's ${settings.antiedit ? 'ON' : 'OFF'}. Pick your poison.`),
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
        { text: formatStylishReply("ANTIEDIT", "Shit broke, couldn't mess with antiedit. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};
