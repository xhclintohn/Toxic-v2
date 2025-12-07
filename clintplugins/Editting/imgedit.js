const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = async (context) => {
  const { client, m, text } = context;

  try {
    if (!m.quoted) return m.reply("BRO FFS QUOTE AN IMAGE 🤦🏻");
    if (!text) return m.reply("TELL ME WHAT TO EDIT YOU 🤡 EXAMPLE: .imgedit make it look like shit");

    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || "";

    if (!mime.startsWith("image/")) {
      return m.reply("THATS NOT A FUCKING IMAGE 🤦🏻 SEND A REAL IMAGE");
    }

    const mediaBuffer = await q.download();
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, mediaBuffer);

    const form = new FormData();
    form.append("files[]", fs.createReadStream(tempFilePath));

    const uploadResponse = await axios.post("https://qu.ax/upload", form, {
      headers: {
        ...form.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    const uploaded = uploadResponse.data?.files?.[0]?.url;
    if (!uploaded) return m.reply("UPLOAD FAILED WTF 🤦🏻 TRY AGAIN");

    await m.reply("EDITING YOUR CRAPPY IMAGE HOLD ON... ⏳");

    const apiUrl = `https://api-faa.my.id/faa/editfoto?url=${encodeURIComponent(uploaded)}&prompt=${encodeURIComponent(text)}`;

    const editResponse = await axios.get(apiUrl, { responseType: "arraybuffer" });

    await client.sendMessage(
      m.chat,
      {
        image: Buffer.from(editResponse.data),
        caption: `HERE'S YOUR EDITED SHIT 🤡\nPROMPT: ${text}\n\n> Tσxιƈ-ɱԃȥ`,
      },
      { quoted: m }
    );
  } catch (error) {
    console.error("Image edit command error:", error);
    await m.reply(`FAILED TO EDIT YOUR TRASH IMAGE 🤦🏻 ERROR: ${error.message}`);
  }
};