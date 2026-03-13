const axios = require('axios');
const FormData = require('form-data');

async function uploadToCatbox(buffer) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, { filename: 'image.png' });

    const response = await axios.post('https://catbox.moe/user/api.php', form, {
        headers: form.getHeaders(),
    });

    if (!response.data || !response.data.includes('catbox')) {
        throw new Error('Upload process failed');
    }

    return response.data;
}

module.exports = {
    name: 'removebg',
    aliases: ['nobg', 'rmbg', 'transparent'],
    description: 'Removes background from images using AI',
    run: async (context) => {
        const { client, m, mime } = context;
        
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const quoted = m.quoted ? m.quoted : m;
        const quotedMime = quoted.mimetype || mime || '';
        
        if (!/image/.test(quotedMime)) {
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ REMOVE BG ≪───\n├ \n├ Do you have eyes? That's clearly\n├ not an image. Quote an actual image\n├ file, you incompetent fool.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            const media = await quoted.download();
            if (!media) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return client.sendMessage(m.chat, {
                    text: '╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Failed to download the image.\n├ Your device is probably as defective\n├ as your judgment.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                }, { quoted: m });
            }

            if (media.length > 10 * 1024 * 1024) {
                await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                return client.sendMessage(m.chat, {
                    text: '╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Image exceeds 10MB limit.\n├ Do you think I have infinite storage?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                }, { quoted: m });
            }

            const imageUrl = await uploadToCatbox(media);
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
                throw new Error('The AI failed to process your image. Probably too complex for its intelligence.');
            }

            const transparentImageUrl = response.data.result;
            const transparentResponse = await axios.get(transparentImageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const transparentImage = Buffer.from(transparentResponse.data);

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

            await client.sendMessage(
                m.chat,
                { 
                    image: transparentImage, 
                    caption: '╭───(    TOXIC-MD    )───\n├───≫ REMOVE BG ≪───\n├ \n├ Background successfully removed.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
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
                        caption: '╭───(    TOXIC-MD    )───\n├───≫ PNG FILE ≪───\n├ \n├ PNG version for higher quality.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧'
                    },
                    { quoted: m }
                );
            }

        } catch (err) {
            console.error('RemoveBG error:', err);
            
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

            let errorMessage = 'An unexpected error occurred';
            
            if (err.message.includes('timeout')) {
                errorMessage = 'Processing took too long. Your image might be too complex or the server is busy.';
            } else if (err.message.includes('Network Error')) {
                errorMessage = 'Network connection failed. Check your internet, you digital neanderthal.';
            } else if (err.message.includes('Upload process failed')) {
                errorMessage = 'Failed to upload image for processing.';
            } else if (err.message.includes('AI failed to process')) {
                errorMessage = 'The AI could not process this image. Try something less abstract.';
            } else if (err.message.includes('ENOTFOUND')) {
                errorMessage = 'Cannot connect to the background removal service.';
            } else {
                errorMessage = err.message;
            }

            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ FAILED ≪───\n├ \n├ Background removal failed.\n├ Error: ${errorMessage}\n├ \n├ Suggestions:\n├ Use clear, high-contrast images\n├ Ensure subject has defined edges\n├ Try a simpler composition\n├ Check your internet connection\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
        }
    }
};