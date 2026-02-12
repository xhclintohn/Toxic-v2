const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'sticker.webp' });
    const response = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
    if (!response.data || !response.data.includes('catbox')) throw new Error('Upload Refused');
    return response.data;
}

module.exports = {
    name: 'toimg',
    aliases: ['toimage', 'stickertoimg', 'sticker'],
    description: 'Converts stickers to images',
    run: async (context) => {
        const { client, m } = context;
        try {
            await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
            if (!m.quoted) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO IMAGE ≪───\n├ \n├ Are you illiterate? QUOTE A STICKER.\n├ The command is not a suggestion.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            const quotedMime = m.quoted.mimetype || '';
            if (!/webp/.test(quotedMime)) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO IMAGE ≪───\n├ \n├ That is not a sticker. Do you need\n├ glasses? That is clearly not a .webp file.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            const stickerBuffer = await m.quoted.download();
            if (!stickerBuffer) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to download the sticker.\n├ Your phone is probably as useless\n├ as you are.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
            const stickerUrl = await uploadToCatbox(stickerBuffer);
            const encodedUrl = encodeURIComponent(stickerUrl);
            const convertApiUrl = `https://api.elrayyxml.web.id/api/maker/convert?url=${encodedUrl}&format=PNG`;
            const response = await axios.get(convertApiUrl, { headers: { 'accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }, timeout: 30000 });
            if (!response.data.status || !response.data.result) throw new Error('The conversion service laughed at your sticker.');
            const imageUrl = response.data.result;
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 20000 });
            const imageBuffer = Buffer.from(imageResponse.data);
            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { image: imageBuffer, caption: '╭───(    TOXIC-MD    )───\n├───≫ TO IMAGE ≪───\n├ \n├ Your sticker is now an image.\n├ A miraculous achievement.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: m });
            await client.sendMessage(m.chat, { document: imageBuffer, mimetype: 'image/png', fileName: `sticker_${Date.now()}.png`, caption: '╭───(    TOXIC-MD    )───\n├───≫ PNG FILE ≪───\n├ \n├ PNG version. Slightly less terrible.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: m });
        } catch (err) {
            console.error('ToImg error:', err);
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            let userMessage = 'The conversion failed. Shocking.';
            if (err.message.includes('timeout')) userMessage = 'Took too long. Your sticker is probably as bloated as your ego.';
            if (err.message.includes('Network Error')) userMessage = 'Network error. Is your router powered by hopes and dreams?';
            if (err.message.includes('Upload Refused')) userMessage = "Couldn't even upload your sticker. It's that bad.";
            if (err.message.includes('conversion service laughed')) userMessage = 'The converter rejected your sticker. Try one that isn\'t abstract garbage.';
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ ${userMessage}\n├ Error: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};