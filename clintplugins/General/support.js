module.exports = async (context) => {
  const { client, m } = context;

  const message = `
╭━━〔 *Toxic-MD Support Links* 〕━━━━╮

> 👑 *Owner*  
https:

> 📢 *Channel Link*  
https:

> 👥 *Group*  
https:

╰━━━━━━━━━━━━━━━━━━━━━━━╯
> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ
`;

  try {
    await client.sendMessage(
      m.chat,
      { text: message },
      { quoted: m }
    );
  } catch (error) {
    console.error("Support command error:", error);
    await m.reply("⚠️ Failed to send support links. Please try again.");
  }
};