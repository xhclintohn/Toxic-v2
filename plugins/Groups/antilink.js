const { getGroupSettings, updateGroupSetting } = require('../../database/config');

module.exports = async (context) => {
  const { client, m, args, prefix, isBotAdmin, isAdmin } = context;

  const formatStylishReply = (title, message) => {
    return `╭───(    TOXIC-MD    )───\n├───≫ ${title} ≪───\n├ \n├ ${message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
  };

  if (!m.isGroup) {
    return await client.sendMessage(m.chat, { text: formatStylishReply("ANTILINK", "This command only works in groups.") }, { quoted: m });
  }

  if (!isAdmin) {
    return await client.sendMessage(m.chat, { text: formatStylishReply("ANTILINK", "Only group admins can change antilink settings.\n├ You're not special.") }, { quoted: m });
  }

  if (!isBotAdmin) {
    return await client.sendMessage(m.chat, { text: formatStylishReply("ANTILINK", "I need to be an admin first.\n├ Make me admin or watch me ignore links.") }, { quoted: m });
  }

  try {
    const groupSettings = await getGroupSettings(m.chat);
    const value = args.join(" ").toLowerCase();
    const validModes = ["off", "delete", "remove"];

    if (validModes.includes(value)) {
      const currentMode = String(groupSettings.antilink || "off").toLowerCase();
      if (currentMode === value) {
        return await client.sendMessage(m.chat, { text: formatStylishReply("ANTILINK", `Antilink is already set to '${value.toUpperCase()}' in this group.`) }, { quoted: m });
      }
      await updateGroupSetting(m.chat, 'antilink', value);
      return await client.sendMessage(m.chat, { text: formatStylishReply("ANTILINK", `Antilink mode updated to '${value.toUpperCase()}' for this group.`) }, { quoted: m });
    }

    const currentStatus = String(groupSettings.antilink || "off").toUpperCase();
    const buttons = [
      { buttonId: `${prefix}antilink delete`, buttonText: { displayText: "DELETE" }, type: 1 },
      { buttonId: `${prefix}antilink remove`, buttonText: { displayText: "REMOVE" }, type: 1 },
      { buttonId: `${prefix}antilink off`, buttonText: { displayText: "OFF" }, type: 1 },
    ];

    await client.sendMessage(m.chat,
      {
        text: formatStylishReply("ANTILINK", `Antilink Mode: ${currentStatus}\n├ Pick your poison.`),
        buttons,
        headerType: 1,
        viewOnce: true,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("Error in Antilink command:", error);
    await client.sendMessage(m.chat, { text: formatStylishReply("ANTILINK", "Something broke. Try again later.") }, { quoted: m });
  }
};