const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.jpg' });

    const res = await axios.post(
        'https://catbox.moe/user/api.php',
        form,
        {
            headers: form.getHeaders()
        }
    );

    if (typeof res.data !== 'string') {
        throw new Error('Catbox upload failed');
    }

    return res.data.trim();
}

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        if (!m.quoted) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ Reply to an image, you blind idiot.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        const q = m.quoted;

        const mime = q.mimetype || '';
        if (!mime.startsWith('image/')) {
            return m.reply('╭───(    TOXIC-MD    )───\n├───≫ IMG EDIT ≪───\n├ \n├ That is not an image, are you stupid?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        }

        const prompt = text || 'make it look epic';

        const mediaBuffer = await q.download?.();
        if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
            throw new Error('Failed to download image, network issue maybe?');
        }

        const uploadedUrl = await uploadToCatbox(mediaBuffer);

        const apiUrl = `https://api.danzy.web.id/api/ai/editimg?url=${encodeURIComponent(uploadedUrl)}&prompt=${encodeURIComponent(prompt)}`;

        const res = await axios.get(
            apiUrl,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            }
        );

        if (!res.data || !res.data.status || !res.data.result || !res.data.result.imageUrl) {
            throw new Error('API failed to edit the image.');
        }

        const imageUrl = res.data.result.imageUrl;

        const imageResponse = await axios.get(
            imageUrl,
            {
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'image/*'
                }
            }
        );

        if (!imageResponse.data || imageResponse.data.length < 1000) {
            throw new Error('Edited image is too small or corrupted.');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                image: Buffer.from(imageResponse.data),
                caption: `╭───(    TOXIC-MD    )───\n├───≫ EDITED IMAGE ≪───\n├ \n├ Prompt: "${prompt}"\n├ Stop wasting my time\n├ with basic edits.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            },
            { quoted: m }
        );

    } catch (err) {
        console.error('Edit Error:', err.message);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Image edit failed.\n├ Error: ${err.message}\n├ Try again, you useless fuck.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};