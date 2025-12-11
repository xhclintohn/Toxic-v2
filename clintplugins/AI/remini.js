const fetch = require('node-fetch');
const FormData = require('form-data');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
        return m.reply(`BOT IS BROKEN BLAME THE DEV 🤡`);
    }

    if (!text && !m.quoted) {
        return m.reply(`GIVE ME AN IMAGE YOU DUMBASS 🤦🏻\nEXAMPLE: .remini https://image.com/trash.png OR REPLY TO IMAGE`);
    }

    let imageUrl = text;

    if (!text && m.quoted && m.quoted.mtype === 'imageMessage') {
        try {
            const buffer = await client.downloadMediaMessage(m.quoted);
            const form = new FormData();
            form.append('files[]', buffer, { filename: 'image.png' });

            const uploadResponse = await fetch('https://qu.ax/upload', {
                method: 'POST',
                body: form,
                headers: form.getHeaders(),
                timeout: 10000
            });
            if (!uploadResponse.ok) {
                throw new Error(`UPLOAD FAILED WITH STATUS ${uploadResponse.status}`);
            }

            const uploadData = await uploadResponse.json();
            if (!uploadData.files?.[0]?.url) {
                throw new Error('NO URL FROM UPLOAD');
            }
            imageUrl = uploadData.files[0].url;
        } catch (uploadError) {
            console.error(`FAILED UPLOAD: ${uploadError.message}`);
            return m.reply(`CANT UPLOAD YOUR SHITTY IMAGE 🤦🏻 TRY AGAIN`);
        }
    }

    if (!imageUrl) {
        return m.reply(`NO VALID IMAGE YOU CLUELESS TWAT 🤡`);
    }

    try {
        await m.reply(`ENHANCING YOUR TRASH IMAGE...`);

        const encodedUrl = encodeURIComponent(imageUrl);
        const apiUrl = `https://api.elrayyxml.web.id/api/tools/remini?url=${encodedUrl}`;
        
        const response = await fetch(apiUrl, {
            timeout: 30000,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/*'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API PUKE ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('image')) {
            throw new Error(`API DIDNT RETURN AN IMAGE 🤦🏻 GOT: ${contentType}`);
        }

        const imageBuffer = await response.buffer();

        await client.sendMessage(
            m.chat,
            {
                image: imageBuffer,
                caption: `HERE'S YOUR ENHANCED SHIT 🤡\n> Tσxιƈ-ɱԃȥ`
            },
            { quoted: m }
        );

    } catch (error) {
        console.error(`ERROR IN REMINI: ${error.message}`);
        await m.reply(`SHIT BROKE 🤦🏻 ERROR: ${error.message}`);
    }
};