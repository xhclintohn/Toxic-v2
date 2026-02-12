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
          { text: formatStylishReply("ANTILINK", "Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m, ad: true }
        );
      }

      const value = args.join(" ").toLowerCase();
      const validModes = ["off", "delete", "remove"];

      if (validModes.includes(value)) {
        const currentMode = String(settings.antilink || "off").toLowerCase();
        if (currentMode === value) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply("ANTILINK", `Antilink is already set to '${value.toUpperCase()}', dumbass.`) },
            { quoted: m, ad: true }
          );
        }

        await updateSetting('antilink', value);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("ANTILINK", `Antilink mode updated to '${value.toUpperCase()}'.`) },
          { quoted: m, ad: true }
        );
      }

      const currentStatus = String(settings.antilink || "off").toLowerCase();

      const buttons = [
        { buttonId: `${prefix}antilink delete`, buttonText: { displayText: "DELETE" }, type: 1 },
        { buttonId: `${prefix}antilink remove`, buttonText: { displayText: "REMOVE" }, type: 1 },
        { buttonId: `${prefix}antilink off`, buttonText: { displayText: "OFF" }, type: 1 },
      ];

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply("ANTILINK", `Antilink Mode: ${currentStatus.toUpperCase()}\n├ Pick your poison.`),
          footer: "> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧",
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m, ad: true }
      );
    } catch (error) {
      console.error("Error in Antilink command:", error);
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("ANTILINK", "Shit broke, couldn't update antilink. Database or something's fucked. Try later.") },
        { quoted: m, ad: true }
      );
    }
  });
};
