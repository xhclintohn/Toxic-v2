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
          { text: formatStylishReply("ANTICALL", "Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();
      const isEnabled = settings.anticall === true;

      if (value === 'on' || value === 'off') {
        const action = value === 'on';
        if (isEnabled === action) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply("ANTICALL", `Yo, genius! Anticall is already ${value.toUpperCase()}! Stop wasting my time, moron.`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('anticall', action);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("ANTICALL", `Anticall ${value.toUpperCase()}! Callers will get wrecked!`) },
          { quoted: m, ad: true }
        );
      }

      const buttons = [
        { buttonId: `${prefix}anticall on`, buttonText: { displayText: "ON" }, type: 1 },
        { buttonId: `${prefix}anticall off`, buttonText: { displayText: "OFF" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply("ANTICALL", `Anticall Status: ${isEnabled ? 'ON' : 'OFF'}. Pick a vibe, noob!`),
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("ANTICALL", "Shit broke, couldn't update anticall. Database or something's fucked. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};
