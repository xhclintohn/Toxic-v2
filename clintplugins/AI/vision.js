const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!m.quoted) 
            return m.reply("QUOTE A FUCKING IMAGE FIRST YOU 🤡");

        if (!text) 
            return m.reply("TELL ME WHAT TO ANALYZE DUMBASS I CANT READ MINDS");

        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || "";

        if (!mime.startsWith("image/"))
            return m.reply("THATS NOT AN IMAGE ARE YOU BLIND?");

        const mediaBuffer = await q.download();
        const tempFile = path.join(__dirname, `temp_${Date.now()}`);
        fs.writeFileSync(tempFile, mediaBuffer);
        const form = new FormData();
        form.append("files[]", fs.createReadStream(tempFile));

        const upload = await axios.post("https://qu.ax/upload", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        fs.existsSync(tempFile) && fs.unlinkSync(tempFile);

        const uploadedURL = upload.data?.files?.[0]?.url;
        if (!uploadedURL)
            return m.reply("UPLOAD FAILED LIKE YOUR LIFE 🤦🏻");

        await m.reply("ANALYZING YOUR SHIT IMAGE HOLD ON...");

        const api = `https://api.ootaizumi.web.id/ai/gptnano?prompt=${encodeURIComponent(text)}&imageUrl=${encodeURIComponent(uploadedURL)}`;
        const result = await axios.get(api);

        if (result.data?.result) {
            return client.sendMessage(
                m.chat,
                {
                    text: `*🤖 IMAGE ANALYSIS*\n\n${result.data.result}\n\n> Tσxιƈ-ɱԃȥ`,
                },
                { quoted: m }
            );
        }

        m.reply("API GAVE ME GIBBERISH PROBABLY BECAUSE YOUR IMAGE SUCKS");

    } catch (err) {
        await m.reply(`SHIT BROKE 🤦🏻 ERROR: ${err.message}`);
    }
};