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
      const validModes = ["false", "true", "remove"];

      if (validModes.includes(value)) {
        const currentMode = String(settings.antistatusmention || "false").toLowerCase();
        if (currentMode === value) {
          return await client.sendMessage(
            m.chat,
            { text: formatStylishReply(`AntiStatusMention is already '${value.toUpperCase()}', dumbass. Stop wasting my time. 😈`) },
            { quoted: m }
          );
        }

        await updateSetting('antistatusmention', value);
        
        let actionMessage = "";
        if (value === "false") actionMessage = "No more policing status mentions, you anarchist! 😴";
        if (value === "true") actionMessage = "Status mentions will be deleted, no mercy! 🗑️";
        if (value === "remove") actionMessage = "Status mentions = Instant removal! Say goodbye! 🚫";
        
        return await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`AntiStatusMention set to '${value.toUpperCase()}'! 🔥 ${actionMessage}`) },
          { quoted: m }
        );
      }

      const currentStatus = String(settings.antistatusmention || "false").toLowerCase();

      const buttons = [
        { buttonId: `${prefix}antistatusmention true`, buttonText: { displayText: "TRUE 🗑️" }, type: 1 },
        { buttonId: `${prefix}antistatusmention remove`, buttonText: { displayText: "REMOVE 🚫" }, type: 1 },
        { buttonId: `${prefix}antistatusmention false`, buttonText: { displayText: "FALSE 😴" }, type: 1 },
      ];

      const emoji =
        currentStatus === "true" ? "🗑️" :
        currentStatus === "remove" ? "🚫" :
        "😴";

      const statusText =
        currentStatus === "true" ? "TRUE (Delete Only)" :
        currentStatus === "remove" ? "REMOVE (Delete & Kick)" :
        "FALSE (Disabled)";

      await client.sendMessage(
        m.chat,
        {
          text: formatStylishReply(`AntiStatusMention: ${statusText} ${emoji}\n\nPick your vibe, noob! 😈`),
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
        { text: formatStylishReply("Shit broke, couldn't mess with antistatusmention. Database or something's fucked. Try later.") },
        { quoted: m }
      );
    }
  });
};