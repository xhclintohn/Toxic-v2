const { getGroupSettings, updateGroupSetting } = require('../../database/config');

module.exports = async (context) => {
  const { client, m, args, prefix, isAdmin, isBotAdmin } = context;

  const formatStylishReply = (message) => {
    return `╭───(    TOXIC-MD    )───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
  };

  if (!m.isGroup) {
    return await client.sendMessage(m.chat, { text: formatStylishReply("This command only works in groups.") }, { quoted: m });
  }

  if (!isAdmin) {
    return await client.sendMessage(m.chat, { text: formatStylishReply("Only group admins can change AntiStatusMention settings.\n├ You're not special.") }, { quoted: m });
  }

  if (!isBotAdmin) {
    return await client.sendMessage(m.chat, { text: formatStylishReply("I need to be an admin first.\n├ Make me admin or watch me ignore status mentions.") }, { quoted: m });
  }

  try {
    const groupSettings = await getGroupSettings(m.chat);
    const value = args.join(" ").toLowerCase();
    const validModes = ["off", "delete", "remove"];

    if (validModes.includes(value)) {
      const currentMode = String(groupSettings.antistatusmention || "off").toLowerCase();
      if (currentMode === value) {
        return await client.sendMessage(m.chat, { text: formatStylishReply(`AntiStatusMention is already '${value.toUpperCase()}' in this group.`) }, { quoted: m });
      }
      await updateGroupSetting(m.chat, 'antistatusmention', value);
      let actionMessage = "";
      if (value === "off") actionMessage = "Status mentions allowed in this group.";
      if (value === "delete") actionMessage = "Status mentions will be deleted with a warning!";
      if (value === "remove") actionMessage = "Status mentions = Instant removal!";
      return await client.sendMessage(m.chat, { text: formatStylishReply(`AntiStatusMention set to '${value.toUpperCase()}' for this group! ${actionMessage}`) }, { quoted: m });
    }

    const currentStatus = String(groupSettings.antistatusmention || "off").toLowerCase();
    const statusText =
      currentStatus === "delete" ? "DELETE (Delete with warning)" :
      currentStatus === "remove" ? "REMOVE (Delete & kick)" :
      "OFF (Disabled)";

    const buttons = [
      { buttonId: `${prefix}antistatusmention delete`, buttonText: { displayText: "DELETE" }, type: 1 },
      { buttonId: `${prefix}antistatusmention remove`, buttonText: { displayText: "REMOVE" }, type: 1 },
      { buttonId: `${prefix}antistatusmention off`, buttonText: { displayText: "OFF" }, type: 1 },
    ];

    await client.sendMessage(m.chat,
      {
        text: formatStylishReply(`AntiStatusMention for this group: ${statusText}\n\nPick an option:`),
        buttons,
        headerType: 1,
        viewOnce: true,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("Error in AntiStatusMention command:", error);
    await client.sendMessage(m.chat, { text: formatStylishReply("Something broke. Try again later.") }, { quoted: m });
  }
};