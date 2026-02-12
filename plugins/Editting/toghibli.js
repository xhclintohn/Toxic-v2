const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadImage(buffer) {
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, buffer);

    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFilePath));

    try {
        const response = await axios.post('https://qu.ax/upload.php', form, {
            headers: form.getHeaders(),
        });

        const link = response.data?.files?.[0]?.url;
        if (!link) throw new Error('No URL returned in response');

        fs.unlinkSync(tempFilePath);
        return { url: link };
    } catch (error) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error(`Upload error: ${error.message}`);
    }
}

module.exports = async (context) => {
    const { client, mime, m } = context;

    const quoted = m.quoted ? m.quoted : m;
    const quotedMime = quoted.mimetype || mime || '';

    if (!/image/.test(quotedMime)) {
        return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO GHIBLI ≪───\n├ \n├ Please reply to or send an image\n├ with this command, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
    }

    await m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO GHIBLI ≪───\n├ \n├ Creating your Ghibli-style artwork...\n├ Please wait.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');

    try {
        const media = await quoted.download();
        if (!media) {
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to download the image.\n├ Try again, loser.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        if (media.length > 10 * 1024 * 1024) {
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ The image is too large (max 10MB).\n├ Compress it, you hoarder.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const { url: imageUrl } = await uploadImage(media);

        const response = await axios.get('https://fgsi.koyeb.app/api/ai/image/toGhibli', {
            params: {
                apikey: 'fgsiapi-2dcdfa06-6d',
                url: imageUrl,
            },
            responseType: 'arraybuffer',
        });

        const ghibliImage = Buffer.from(response.data);

        await client.sendMessage(
            m.chat,
            {
                image: ghibliImage,
                caption: '╭───(    TOXIC-MD    )───\n├───≫ GHIBLI STYLE ≪───\n├ \n├ Your image has been reimagined in\n├ *Studio Ghibli* style!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
            },
            { quoted: m }
        );
    } catch (err) {
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Error while generating Ghibli-style\n├ image: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};