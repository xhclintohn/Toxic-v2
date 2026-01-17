const fetch = require('node-fetch');
const FormData = require('form-data');

const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━◈`;
};

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.png' });

    const response = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
    });

    const text = await response.text();
    if (!text.includes('catbox')) {
        throw new Error('UPLOAD FAILED');
    }

    return text;
}

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(formatStylishReply("BOT IS BROKEN BLAME THE DEV 🤡"));
    }

    if (!text && !m.quoted && !(m.mtype === 'imageMessage' && m.body.includes('.remini'))) {
        return m.reply(formatStylishReply("GIVE ME AN IMAGE YOU DUMBASS 🤦🏻\nEXAMPLE: .remini https://image.com/trash.png OR REPLY TO IMAGE"));
    }

    let imageUrl = text;

    if ((!text || text === '.remini') && m.quoted && m.quoted.mtype === 'imageMessage') {
        try {
            const buffer = await client.downloadMediaMessage(m.quoted);
            imageUrl = await uploadToCatbox(buffer);
        } catch (uploadError) {
            console.error(`FAILED UPLOAD: ${uploadError.message}`);
            return m.reply(formatStylishReply("CANT UPLOAD YOUR SHITTY IMAGE 🤦🏻 TRY AGAIN"));
        }
    }

    if (m.mtype === 'imageMessage' && m.body.includes('.remini')) {
        try {
            const buffer = await client.downloadMediaMessage(m);
            imageUrl = await uploadToCatbox(buffer);
        } catch (uploadError) {
            console.error(`FAILED UPLOAD: ${uploadError.message}`);
            return m.reply(formatStylishReply("CANT UPLOAD YOUR SHITTY IMAGE 🤦🏻 TRY AGAIN"));
        }
    }

    if (!imageUrl || imageUrl === '.remini') {
        return m.reply(formatStylishReply("NO VALID IMAGE YOU CLUELESS TWAT 🤡"));
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(imageUrl);
        const apiUrl = `https://api-faa.my.id/faa/superhd?url=${encodedUrl}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API PUKE ${response.status} ${response.statusText}`);
        }

        const imageBuffer = await response.buffer();

        if (!imageBuffer || imageBuffer.length < 1000) {
            throw new Error(`API DIDNT RETURN AN IMAGE 🤦🏻`);
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                image: imageBuffer,
                caption: `◈━━━━━━━━━━━━━━━◈\n│❒ ENHANCED IMAGE ✅\n│❒ Tσxιƈ-ɱԃȥ\n◈━━━━━━━━━━━━━━━◈`
            },
            { quoted: m }
        );

    } catch (error) {
        console.error(`ERROR IN REMINI: ${error.message}`);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(formatStylishReply(`SHIT BROKE 🤦🏻 ERROR: ${error.message}`));
    }
};