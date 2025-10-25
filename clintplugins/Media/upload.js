module.exports = async (context) => {
    const { client, m, uploadtoimgur } = context;
    const fs = require("fs");
    const path = require('path');
    const util = require("util");

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

        await client.sendMessage(m.chat, {
            interactiveMessage: {
                header: "Media Uploaded",
                title: `Media Link: ${link}`,
                footer: "Powered by Toxic-MD",
                buttons: [
                    {
                        name: "cta_copy",
                        buttonParamsJson: JSON.stringify({
                            display_text: "Copy Link",
                            id: `copy_${Date.now()}`,
                            copy_code: link
                        })
                    }
                ]
            }
        }, { quoted: m });

        if (fs.existsSync(fta2)) {
            fs.unlinkSync(fta2);
        }
    } else {
        m.reply(`Error occurred...`);
    }
};