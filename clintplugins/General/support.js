module.exports = async (context) => {
  const { client, m } = context;

  const message = `
╭━━〔 *Toxic-MD Support Links* 〕━━━━╮

> 👑 *Owner*  
https://wa.me/254735342808

> 📢 *Channel Link*  
https://whatsapp.com/channel/0029VagJlnG6xCSU2tS1Vz19

> 👥 *Group*  
https://chat.whatsapp.com/GoXKLVJgTAAC3556FXkfFI

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