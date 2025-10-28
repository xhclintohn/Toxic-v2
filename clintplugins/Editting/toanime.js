const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// === UPLOAD TO qu.ax ===
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
    description: 'Convert a replied image to anime style',
    run: async (context) => {
        const { client, m, mime } = context;

        // === 1. MUST REPLY TO A MESSAGE ===
        if (!m.quoted) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❌ You must *reply* to an image!\n│Example: Reply image → \`.toanime\`\n┗━━━━━━━━━━━━━━━┛`);
        }

        // === 2. REPLIED MESSAGE MUST BE IMAGE ===
        const quoted = m.quoted;
        const quotedMime = quoted.mtype === 'imageMessage' 
            ? quoted.msg.mimetype 
            : quoted.mimetype;

        if (!quotedMime || !quotedMime.startsWith('image/')) {
            return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❌ The replied message is not an image!\n│Please reply to a *photo*.\n┗━━━━━━━━━━━━━━━┛`);
        }

        // === 3. SEND PROCESSING MESSAGE ===
        const processing = await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│Converting to anime...\n│Please wait!\n┗━━━━━━━━━━━━━━━┛`);

        try {
            // === 4. DOWNLOAD IMAGE ===
            const media = await quoted.download();
            if (!media || media.length === 0) throw new Error('Failed to download image');

            // === 5. SIZE LIMIT ===
            if (media.length > 10 * 1024 * 1024) {
                return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│Image too large! Max 10MB.\n┗━━━━━━━━━━━━━━━┛`);
            }

            // === 6. UPLOAD TO qu.ax ===
            const { url: imageUrl } = await uploadImage(media);

            // === 7. CALL TO-ANIME API ===
            const apiResponse = await axios.get('https://fgsi.koyeb.app/api/ai/image/toAnime', {
                params: {
                    apikey: 'fgsiapi-2dcdfa06-6d',
                    url: imageUrl
                },
                responseType: 'arraybuffer',
                timeout: 90000
            });

            const animeBuffer = Buffer.from(apiResponse.data);

            // === 8. SEND RESULT ===
            await client.sendMessage(m.chat, {
                image: animeBuffer,
                caption: `◈━━━━━━━━━━━━━━━━◈\n│ANIME TRANSFORMATION COMPLETE!\n│@everyone look at this weeb\n┗━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender]
            }, { quoted: m });

            // === 9. DELETE PROCESSING MSG ===
            await client.sendMessage(m.chat, { delete: processing.key });

        } catch (err) {
            console.error('ToAnime Error:', err.message);

            const errorMsg = err.response
                ? `API Error: ${err.response.status}`
                : err.message.includes('timeout') ? 'API timed out. Try again.'
                : `Failed: ${err.message}`;

            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│${errorMsg}\n┗━━━━━━━━━━━━━━━┛`);
        }
    }
};