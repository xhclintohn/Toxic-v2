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
        const { client, m } = context;

        // === 1. MUST REPLY ===
        if (!m.quoted) {
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n│You must *reply* to an image!\n│Example: Reply image → \`.toanime\`\n╰──────────────────☉`);
        }

        const quoted = m.quoted;

        // === 2. SAFE MIME CHECK ===
        let quotedMime = '';
        if (quoted.mtype === 'imageMessage' && quoted.msg?.mimetype) {
            quotedMime = quoted.msg.mimetype;
        } else if (quoted.mimetype) {
            quotedMime = quoted.mimetype;
        }

        if (!quotedMime || !quotedMime.startsWith('image/')) {
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n│The replied message is *not an image*!\n│Please reply to a *photo*.\n╰──────────────────☉`);
        }

        // === 3. PROCESSING ===
        const processing = await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n│Converting to anime...\n│Please wait!\n╰──────────────────☉`);

        try {
            // === 4. DOWNLOAD ===
            const media = await quoted.download();
            if (!media || media.length === 0) throw new Error('Failed to download');

            // === 5. SIZE ===
            if (media.length > 10 * 1024 * 1024) {
                return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n│Image too large! Max 10MB.\n╰──────────────────☉`);
            }

            // === 6. UPLOAD ===
            const { url: imageUrl } = await uploadImage(media);

            // === 7. API CALL ===
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
                caption: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n│ANIME TRANSFORMATION COMPLETE!\n│@everyone look at this weeb\n╰──────────────────☉`,
                mentions: [m.sender]
            }, { quoted: m });

            // === 9. CLEANUP ===
            await client.sendMessage(m.chat, { delete: processing.key });

        } catch (err) {
            console.error('ToAnime Error:', err.message);

            const errorMsg = err.response
                ? `API Error: ${err.response.status}`
                : err.message.includes('timeout') ? 'API timed out.'
                : `Failed: ${err.message}`;

            await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n│${errorMsg}\n╰──────────────────☉`);
        }
    }
};