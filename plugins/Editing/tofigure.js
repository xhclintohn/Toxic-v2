const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.png' });
    const response = await axios.post('https://catbox.moe/user/api.php', form, { headers: form.getHeaders() });
    if (!response.data || !response.data.includes('catbox')) throw new Error('Upload Refused');
    return response.data;
}

module.exports = async (context) => {
    const { client, m } = context;
    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
        const quoted = m.quoted ? m.quoted : m;
        const quotedMime = quoted.mimetype || '';
        if (!/image/.test(quotedMime)) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ TO FIGURE ≪───\n├ \n├ That is not an image. Are your eyes\n├ broken? Quote a real image, you imbecile.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        const media = await quoted.download();
        if (!media) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to download your worthless image.\n├ Try sending something that actually exists.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        if (media.length > 10 * 1024 * 1024) return m.reply('╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Your image is too large. 10MB MAX,\n├ you digital hoarder.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧');
        const imageUrl = await uploadToCatbox(media);
        const apiURL = `https://api.fikmydomainsz.xyz/imagecreator/tofigur?url=${encodeURIComponent(imageUrl)}`;
        const response = await axios.get(apiURL);
        if (!response.data || !response.data.status || !response.data.result) throw new Error('The API vomited nonsense back at me.');
        const resultUrl = response.data.result;
        const figureBuffer = (await axios.get(resultUrl, { responseType: 'arraybuffer' })).data;
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await client.sendMessage(m.chat, { image: Buffer.from(figureBuffer), caption: '╭───(    TOXIC-MD    )───\n├───≫ TO FIGURE ≪───\n├ \n├ Here. It is now a "figure".\n├ You are welcome.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: m });
    } catch (err) {
        console.error('tofigur error:', err);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        let userMessage = 'It failed. What a surprise.';
        if (err.message.includes('timeout')) userMessage = 'Took too long. Your image is probably as heavy as your stupidity.';
        if (err.message.includes('Network Error')) userMessage = 'Network error. Are you on dial-up?';
        if (err.message.includes('Upload Refused')) userMessage = "Couldn't even upload your image. Pathetic.";
        if (err.message.includes('API vomited')) userMessage = 'The art service rejected your image. It has standards.';
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ ${userMessage}\n├ Error: ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};