const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Upload function to send image to qu.ax and get a URL
async function uploadImage(buffer) {
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.jpg`);
    fs.writeFileSync(tempFilePath, buffer);

    const form = new FormData();
    form.append('files[]', fs.createReadStream(tempFilePath));

    try {
        const response = await axios.post('https://qu.ax/upload.php', form, {
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

        // Determine whether the image is from quoted or current message
        const quoted = m.quoted ? m.quoted : m;
        const quotedMime = quoted.mimetype || mime || '';

        if (!/image/.test(quotedMime)) {
            return client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 Please reply to an image!\n│❒ Example: Reply to an image with .removebg\n┗━━━━━━━━━━━━━━━┛`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        // Send loading message
        const loadingMsg = await client.sendMessage(m.chat, {
            text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Removing background from image... 🎨\n│❒ This may take a moment ⏳\n┗━━━━━━━━━━━━━━━┛'
        }, { quoted: m });

        try {
            // Step 1: Download image
            const media = await quoted.download();

            if (!media) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Failed to download the image!\n│❒ Please try again with a different image\n┗━━━━━━━━━━━━━━━┛'
                }, { quoted: m });
            }

            // Step 2: Size limit check
            if (media.length > 10 * 1024 * 1024) {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
                return client.sendMessage(m.chat, {
                    text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Image is too large!\n│❒ Maximum size: 10MB\n┗━━━━━━━━━━━━━━━┛'
                }, { quoted: m });
            }

            // Step 3: Upload image to get a public URL
            await client.sendMessage(m.chat, {
                text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Uploading image for processing... 📤\n┗━━━━━━━━━━━━━━━┛'
            }, { quoted: m });

            const { url: imageUrl } = await uploadImage(media);

            // Step 4: Call the remove background API
            await client.sendMessage(m.chat, {
                text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Processing image with AI... 🤖\n│❒ Removing background...\n┗━━━━━━━━━━━━━━━┛'
            }, { quoted: m });

            const encodedUrl = encodeURIComponent(imageUrl);
            const removeBgApiUrl = `https://api.ootaizumi.web.id/tools/removebg?imageUrl=${encodedUrl}`;
            
            const response = await axios.get(removeBgApiUrl, {
                headers: { 
                    'accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 60000 // 60 second timeout for processing
            });

            // Validate API response
            if (!response.data.status || !response.data.result) {
                throw new Error('Background removal API failed to process the image');
            }

            const transparentImageUrl = response.data.result;

            // Step 5: Download the transparent image
            await client.sendMessage(m.chat, {
                text: '◈━━━━━━━━━━━━━━━━◈\n│❒ Downloading result... 📥\n┗━━━━━━━━━━━━━━━┛'
            }, { quoted: m });

            const transparentResponse = await axios.get(transparentImageUrl, {
                responseType: 'arraybuffer',
                timeout: 30000
            });

            const transparentImage = Buffer.from(transparentResponse.data);

            // Step 6: Delete loading message and send result
            await client.sendMessage(m.chat, { delete: loadingMsg.key });

            await client.sendMessage(
                m.chat,
                { 
                    image: transparentImage, 
                    caption: '◈━━━━━━━━━━━━━━━━◈\n│❒ Background Removed! ✨\n│❒ Image is now transparent\n│❒ Perfect for stickers! 🎨\n┗━━━━━━━━━━━━━━━┛' 
                },
                { quoted: m }
            );

            // Also send as document for better quality if it's PNG
            if (transparentResponse.headers['content-type']?.includes('png')) {
                await client.sendMessage(
                    m.chat,
                    {
                        document: transparentImage,
                        mimetype: 'image/png',
                        fileName: `transparent_bg_${Date.now()}.png`,
                        caption: '◈━━━━━━━━━━━━━━━━◈\n│❒ PNG Version (Better Quality)\n│❒ Use this for stickers! 🎨\n┗━━━━━━━━━━━━━━━┛'
                    },
                    { quoted: m }
                );
            }

        } catch (err) {
            console.error('RemoveBG error:', err);
            
            // Delete loading message on error
            try {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
            } catch (e) {
                // Ignore delete errors
            }

            let errorMessage = 'An unexpected error occurred';
            
            if (err.message.includes('timeout')) {
                errorMessage = 'Processing timed out. The image might be too complex or the server is busy.';
            } else if (err.message.includes('Network Error')) {
                errorMessage = 'Network error. Please check your connection and try again.';
            } else if (err.message.includes('Upload error')) {
                errorMessage = 'Failed to upload image for processing.';
            } else if (err.message.includes('Background removal API failed')) {
                errorMessage = 'The AI failed to remove the background from this image.';
            } else if (err.message.includes('ENOTFOUND')) {
                errorMessage = 'Cannot connect to the background removal service.';
            } else {
                errorMessage = err.message;
            }

            await client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Background Removal Failed! 😤\n│❒ Error: ${errorMessage}\n│❒ \n│❒ Tips:\n│❒ • Use clear, high-contrast images\n│❒ • Ensure subject is well-defined\n│❒ • Try with different image\n┗━━━━━━━━━━━━━━━┛`
            }, { quoted: m });
        }
    }
};