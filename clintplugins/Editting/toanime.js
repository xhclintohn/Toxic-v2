const axios = require('axios');
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

        const link = response.data.files[0].url;
        if (!link) throw new Error('No URL returned');

        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return { url: link };
    } catch (error) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw error;
    }
}

module.exports = {
    name: 'toanime',
    aliases: ['anime', 'toon', 'cartoon'],
    description: 'Convert any image to anime style',
    run: async (context) => {
        const { client, m, mime } = context;

        // === CHECK IF IMAGE ===
        if (!/image/.test(mime)) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Reply to an image with *toanime*\n┗━━━━━━━━━━━━━━━┛`);
        }

        // === SEND PROCESSING MSG ===
        const processingMsg = await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Converting to anime... Please wait!\n┗━━━━━━━━━━━━━━━┛`);

        try {
            // Step 1: Download image
            const media = await m.quoted.download();

            // Step 2: Size limit (10MB)
            if (media.length > 10 * 1024 * 1024) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Image too large! Max 10MB.\n┗━━━━━━━━━━━━━━━┛`);
            }

            // Step 3: Upload to qu.ax
            const uploadResult = await uploadImage(media);
            const imageUrl = uploadResult.url;

            // Step 4: Call To-Anime API
            const apiUrl = `https://fgsi.koyeb.app/api/ai/image/toAnime`;
            const response = await axios.get(apiUrl, {
                params: {
                    apikey: "fgsiapi-2dcdfa06-6d",
                    url: imageUrl
                },
                responseType: 'arraybuffer',
                timeout: 60000 // 60 sec
            });

            const animeImage = Buffer.from(response.data);

            // Step 5: Send result
            await client.sendMessage(m.chat, {
                image: animeImage,
                caption: `◈━━━━━━━━━━━━━━━━◈\n│ ANIME TRANSFORMATION COMPLETE!\n┗━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender]
            }, { quoted: m });

            // Delete processing message
            await client.sendMessage(m.chat, { delete: processingMsg.key });

        } catch (err) {
            console.error('ToAnime Error:', err.message);

            const errorText = err.response
                ? `API Error: ${err.response.status} - ${err.response.statusText}`
                : `Failed: ${err.message}`;

            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❌ ${errorText}\n┗━━━━━━━━━━━━━━━┛`);
        }
    }
};