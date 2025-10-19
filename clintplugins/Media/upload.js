module.exports = async (context) => {
  const { client, m, uploadtoimgur } = context;
  const fs = require("fs");
  const path = require('path');

  let q = m.quoted ? m.quoted : m;
  let mime = (q.msg || q).mimetype || '';

  if (!mime) return m.reply('Quote an image or video');

  let mediaBuffer = await q.download();

  if (mediaBuffer.length > 10 * 1024 * 1024) return m.reply('Media is too large.');

  let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);

  if (isTele) {
    let fta2 = await client.downloadAndSaveMediaMessage(q);
    let link = await uploadtoimgur(fta2);

    const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);

    // Interactive message with cta_copy button
    await client.sendMessage(m.chat, {
      interactiveMessage: {
        title: "Media Uploaded",
        body: { text: `Media Link:\n\n${link}\n\nFile Size: ${fileSizeMB} MB` },
        footer: { text: `Pσɯҽɾҽԃ Ⴆყ ${context.botname}` },
        buttons: [
          {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
              display_text: "Copy Link",
              id: "12345",
              copy_code: link
            })
          }
        ]
      }
    }, { quoted: m });

    // Clean up the saved media file
    if (fs.existsSync(fta2)) {
      fs.unlinkSync(fta2);
    }
  } else {
    m.reply(`Error occurred: Unsupported media type.`);
  }
};