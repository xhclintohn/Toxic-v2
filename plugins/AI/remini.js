const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.png' });

    const response = await axios.post(
        'https://catbox.moe/user/api.php',
        form,
        {
            headers: form.getHeaders(),
        }
    );

    const text = response.data;
    if (!text.includes('catbox')) {
        throw new Error('Upload failed');
    }

    return text.trim();
}

module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text && !m.quoted && !(m.mtype === 'imageMessage' && m.body.includes('.remini'))) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Mɪssɪɴɢ Iᴍᴀɢᴇ ≪───\n々 Give me an image you dumbass 🤦🏻\n々 Example: .remini https://image.com/trash.png\n々 Or reply to an image\n╭───(  )───`);
    }

    let imageUrl = text;

    if ((!text || text === '.remini') && m.quoted && m.quoted.mtype === 'imageMessage') {
        try {
            const buffer = await client.downloadMediaMessage(m.quoted);
            imageUrl = await uploadToCatbox(buffer);
        } catch (uploadError) {
            console.error(`Upload failed: ${uploadError.message}`);
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Uᴘʟᴏᴀᴅ Fᴀɪʟᴇᴅ ≪───\n々 Can't upload your shitty image 🤦🏻\n々 Try again, idiot\n╭───(  )───`);
        }
    }

    if (m.mtype === 'imageMessage' && m.body.includes('.remini')) {
        try {
            const buffer = await client.downloadMediaMessage(m);
            imageUrl = await uploadToCatbox(buffer);
        } catch (uploadError) {
            console.error(`Upload failed: ${uploadError.message}`);
            return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Uᴘʟᴏᴀᴅ Fᴀɪʟᴇᴅ ≪───\n々 Can't upload your shitty image 🤦🏻\n々 Try again, idiot\n╭───(  )───`);
        }
    }

    if (!imageUrl || imageUrl === '.remini') {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Nᴏ Iᴍᴀɢᴇ ≪───\n々 No valid image, you clueless twat 🤡\n╭───(  )───`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(imageUrl);
        const apiUrl = `https://api.deline.web.id/tools/hd?url=${encodedUrl}`;

        const response = await axios.get(apiUrl, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*'
            }
        });

        if (!response.data || response.data.length < 1000) {
            throw new Error('API returned empty image');
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                image: response.data,
                caption: `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Eɴʜᴀɴᴄᴇᴅ Iᴍᴀɢᴇ ≪───\n々 Your shitty image is now HD.\n々 Still looks like garbage though.\n╭───(  )───`
            },
            { quoted: m }
        );

    } catch (error) {
        console.error(`Remini error: ${error.message}`);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        
        let errorMsg = `Shit broke 🤦🏻 Error: ${error.message}`;
        if (error.response?.status === 404) {
            errorMsg = 'API not found. Maybe your image URL is trash.';
        } else if (error.message.includes('timeout')) {
            errorMsg = 'API timed out. Too busy fixing your ugly image.';
        }
        
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 ${errorMsg}\n╭───(  )───`);
    }
};