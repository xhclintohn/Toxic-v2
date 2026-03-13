module.exports = async (context) => {
  const { client, m } = context;

  const message = `╭───(    TOXIC-MD    )───
├───≫ Sᴜᴘᴘᴏʀᴛ Lɪɴᴋs ≪───
├ 
├ *Owner*
├ https:
├ 
├ *Channel Link*
├ https:
├ 
├ *Group*
├ https:
╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

  try {
    await client.sendMessage(
      m.chat,
      { text: message },
      { quoted: m }
    );
  } catch (error) {
    console.error("Support command error:", error);
    await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Failed to send support links.\n├ Try again, you impatient fool.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};
