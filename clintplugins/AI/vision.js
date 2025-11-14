const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!m.quoted) 
            return m.reply("📸 *Quote an image first, genius.*");

        if (!text) 
            return m.reply("📝 *At least tell me what to analyze… I can’t read minds (yet).*");

        const q = m.quoted || m;
        const mime = (q.msg || q).mimetype || "";

        if (!mime.startsWith("image/"))
            return m.reply("⚠️ *That's not an image. Unless you're blind too?*");

        // download
        const mediaBuffer = await q.download();

        // temp save
        const tempFile = path.join(__dirname, `temp_${Date.now()}`);
        fs.writeFileSync(tempFile, mediaBuffer);

        // upload to qu.ax
        const form = new FormData();
        form.append("files[]", fs.createReadStream(tempFile));

        const upload = await axios.post("https://qu.ax/upload.php", form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        // remove temp
        fs.existsSync(tempFile) && fs.unlinkSync(tempFile);

        const uploadedURL = upload.data?.files?.[0]?.url;
        if (!uploadedURL)
            return m.reply("❌ *Image upload flopped harder than your grades.*");

        await m.reply("🧠 *Hold up — cooking the analysis…*");

        // GPTNano Vision
        const api = `https://api.ootaizumi.web.id/ai/gptnano?prompt=${encodeURIComponent(text)}&imageUrl=${encodeURIComponent(uploadedURL)}`;
        const result = await axios.get(api);

        if (result.data?.result) {
            return client.sendMessage(
                m.chat,
                {
                    text: `*🔍 Toxic-MD Vision Result*\n\n${result.data.result}\n\n> 🧪 *Served with extra toxicity.*`,
                },
                { quoted: m }
            );
        }

        m.reply("⚠️ *API returned nonsense. Must be contagious—like your bad decisions.*");

    } catch (err) {
        await m.reply(`❌ *Error: ${err.message}\nFix your chaos and try again.*`);
    }
};