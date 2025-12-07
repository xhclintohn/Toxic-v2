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
        const response = await axios.post('https://qu.ax/upload', form, {
            headers: form.getHeaders(),
        });
        const link = response.data?.files?.[0]?.url;
        if (!link) throw new Error('No URL returned in response');
        fs.unlinkSync(tempFilePath);
        return { url: link };
    } catch (error) {
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        throw new Error(`Upload error: ${error.message}`);
    }
}

module.exports = {
    name: 'removebg',
    aliases: ['nobg', 'rmbg', 'transparent'],
    description: 'Removes background from images using AI',
    run: async (context) => {
        const { client, m, mime } = context;
        const quoted = m.quoted ? m.quoted : m;
        const quotedMime = quoted.mimetype || mime || '';
        if (!/image/.test(quotedMime)) {
            return client.sendMessage(m.chat, {
                text: `BRO FFS QUOTE A FUCKING IMAGE 🤦🏻\nEXAMPLE: REPLY TO AN IMAGE WITH .removebg`,
                mentions: [m.sender]
            }, { quoted: m });
        }
        const loadingMsg = await client.sendMessage(m.chat, {
            text: 'REMOVING THAT SHITTY BACKGROUND... HOLD ON 🤡'
        }, { quoted: m });
        try {
            const media = await quoted.download();
            if (!media) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: 'FAILED TO DOWNLOAD YOUR TRASH IMAGE 🤦🏻 TRY AGAIN'
                }, { quoted: m });
            }
            if (media.length > 10 * 1024 * 1024) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: 'IMAGE TOO BIG DUMMY 🤡 MAX 10MB'
                }, { quoted: m });
            }
            const { url: imageUrl } = await uploadImage(media);
            const encodedUrl = encodeURIComponent(imageUrl);
            const removeBgApiUrl = `https://api.ootaizumi.web.id/tools/removebg?imageUrl=${encodedUrl}`;
            const response = await axios.get(removeBgApiUrl, {
                headers: { 
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 60000
            });
            if (!response.data.status || !response.data.result) {
                throw new Error('AI FAILED TO REMOVE YOUR BACKGROUND 🤡');
            }
            const transparentImageUrl = response.data.result;
            const transparentResponse = await axios.get(transparentImageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });
            const transparentImage = Buffer.from(transparentResponse.data);
            await client.sendMessage(m.chat, { delete: loadingMsg.key });
            await client.sendMessage(
                m.chat,
                { 
                    image: transparentImage, 
                    caption: 'HERE YOUR TRANSPARENT SHIT 🤡\n> Tσxιƈ-ɱԃȥ'
                },
                { quoted: m }
            );
            if (transparentResponse.headers['content-type']?.includes('png')) {
                await client.sendMessage(
                    m.chat,
                    {
                        document: transparentImage,
                        mimetype: 'image/png',
                        fileName: `transparent_bg_${Date.now()}.png`,
                        caption: 'PNG VERSION (FOR STICKERS) 🎨\n> Tσxιƈ-ɱԃȥ'
                    },
                    { quoted: m }
                );
            }
        } catch (err) {
            console.error('RemoveBG error:', err);
            try {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
            } catch (e) {}
            let errorMessage = 'SOME SHIT WENT WRONG 🤦🏻';
            if (err.message.includes('timeout')) {
                errorMessage = 'TOOK TOO LONG YOUR IMAGE PROBABLY SUCKS 🤡';
            } else if (err.message.includes('Network Error')) {
                errorMessage = 'NETWORK ERROR CHECK YOUR INTERNET DUMMY';
            } else if (err.message.includes('Upload error')) {
                errorMessage = 'FAILED TO UPLOAD YOUR TRASH IMAGE 🤦🏻';
            } else if (err.message.includes('AI FAILED')) {
                errorMessage = 'AI COULDNT REMOVE THAT SHITTY BACKGROUND 🤡';
            } else if (err.message.includes('ENOTFOUND')) {
                errorMessage = 'CANT CONNECT TO THE SERVICE RIGHT NOW';
            } else {
                errorMessage = err.message;
            }
            await client.sendMessage(m.chat, {
                text: `FAILED TO REMOVE BACKGROUND 🤦🏻\nERROR: ${errorMessage}\n\nTIPS:\n• USE CLEAR IMAGES\n• NOT TOO COMPLICATED\n• TRY DIFFERENT IMAGE`
            }, { quoted: m });
        }
    }
};