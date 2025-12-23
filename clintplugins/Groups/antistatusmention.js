const { getSettings, updateSetting } = require('../../Database/config');
const ownerMiddleware = require('../../utility/botUtil/Ownermiddleware');

module.exports = async (context) => {
  await ownerMiddleware(context, async () => {
    const { client, m, args, prefix } = context;

    const formatStylishReply = (message) => {
      return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
    };

    try {
      const settings = await getSettings();
      if (!settings || Object.keys(settings).length === 0) {
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Database is fucked, no settings found. Fix it, loser.") },
          { quoted: m }
        );
      }

      const value = args.join(" ").toLowerCase();
      const validModes = ["off", "delete", "remove"];

      if (validModes.includes(value)) {
        const currentMode = String(settings.antistatusmention || "off").toLowerCase();
        if (currentMode === value) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`AntiStatusMention is already set to '${value.toUpperCase()}', dumbass.`) },
            { quoted: m }
          );
        }

        await updateSetting('antistatusmention', value);
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`AntiStatusMention mode updated to '${value.toUpperCase()}'. 🔥`) },
          { quoted: m }
        );
      }

      const currentStatus = String(settings.antistatusmention || "off").toLowerCase();

      const buttons = [
        { buttonId: `${prefix}antistatusmention delete`, buttonText: { displayText: "DELETE 🗑️" }, type: 1 },
        { buttonId: `${prefix}antistatusmention remove`, buttonText: { displayText: "REMOVE 🚫" }, type: 1 },
        { buttonId: `${prefix}antistatusmention off`, buttonText: { displayText: "OFF 😴" }, type: 1 },
      ];

      const emoji =
        currentStatus === "delete" ? "🗑️" :
        currentStatus === "remove" ? "🚫" :
        "😴";

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply(`AntiStatusMention Mode: ${currentStatus.toUpperCase()} ${emoji}\nPick your poison. 💀`),
          footer: "> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ",
          buttons,
          headerType: 1,
          viewOnce: true,
        },
        { quoted: m }
      );
    } catch (error) {
      console.error("Error in AntiStatusMention command:", error);
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Shit broke, couldn’t update antistatusmention.") },
        { quoted: m }
      );
    }
  });
};