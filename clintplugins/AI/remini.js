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
        const encodedUrl = encodeURIComponent(imageUrl);
        const apiUrl = `https://api.giftedtech.web.id/api/tools/remini?apikey=gifted_api_se5dccy&url=${encodedUrl}`;
        const response = await fetch(apiUrl, {
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (!response.ok) {
            throw new Error(`API PUKE ${response.status}`);
        }

        const data = await response.json();
        if (!data.success || !data.result || !data.result.image_url) {
            return m.reply(`API IS USELESS 🤡 ${data.msg || 'NO ENHANCED IMAGE YOU LOSER'}`);
        }

        const { image_url } = data.result;

        const urlCheck = await fetch(image_url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        
        if (!urlCheck.ok) {
            const imageResponse = await fetch(image_url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            if (!imageResponse.ok) {
                throw new Error(`IMAGE URL DEAD ${imageResponse.status}`);
            }
            const imageBuffer = await imageResponse.buffer();

            await m.reply(`ENHANCING YOUR TRASH IMAGE...`);
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        image: imageBuffer,
                        fileName: 'enhanced_image.png'
                    },
                    { quoted: m }
                );
            } catch (sendError) {
                console.error(`FAILED TO SEND IMAGE: ${sendError.message}`);
                throw new Error(`CANT SEND ENHANCED IMAGE ${sendError.message}`);
            }
        } else {
            await m.reply(`ENHANCING YOUR TRASH IMAGE...`);
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        image: { url: image_url },
                        fileName: 'enhanced_image.png'
                    },
                    { quoted: m }
                );
            } catch (sendError) {
                console.error(`FAILED TO SEND IMAGE: ${sendError.message}`);
                throw new Error(`CANT SEND ENHANCED IMAGE ${sendError.message}`);
            }
        }

        await client.sendMessage(m.chat, { text: `> Tσxιƈ-ɱԃȥ` }, { quoted: m });
    } catch (error) {
        console.error(`ERROR IN REMINI: ${error.message}`);
        await m.reply(`SHIT BROKE 🤦🏻 CANT ENHANCE YOUR IMAGE TRY LATER`);
    }
};