const fetch = require('node-fetch');

module.exports = {
    name: 'brat',
    aliases: ['bratsticker', 'brattext'],
    description: 'Creates brat style text stickers',
    run: async (context) => {
        const { client, m, prefix } = context;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
        };

        /**
         * Extract text from message
         */
        const text = m.body.replace(new RegExp(`^${prefix}(brat|bratsticker|brattext)\\s*`, 'i'), '').trim();
        
        if (!text) {
            return client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the text!\n│❒ Example: ${prefix}brat Hello there\n│❒ Or: ${prefix}bratsticker Your text here\n◈━━━━━━━━━━━━━━━━◈`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        // Limit text length
        if (text.length > 50) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply('Text too long! 😤\nMaximum 50 characters allowed.')
            }, { quoted: m });
        }

        try {
            /**
             * Send loading message
             */
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Creating brat sticker... 🎨\nText: "${text}"\nPlease wait... ⏳`)
            }, { quoted: m });

            /**
             * Call the brat API
             */
            const apiUrl = `https://api.ootaizumi.web.id/generator/brat?text=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            /**
             * Handle API response
             */
            if (!data.status || !data.result) {
                throw new Error(data.message || 'Failed to generate brat sticker');
            }

            const resultUrl = data.result;

            // Delete loading message
            await client.sendMessage(m.chat, { 
                delete: loadingMsg.key 
            });

            /**
             * Check if result is an image URL and send accordingly
             */
            if (resultUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
                // It's an image - send as sticker
                try {
                    await client.sendMessage(
                        m.chat,
                        {
                            sticker: { url: resultUrl },
                            caption: formatStylishReply(`Brat Sticker Created! ✨\nText: "${text}"`)
                        },
                        { quoted: m }
                    );
                } catch (stickerError) {
                    console.error('Sticker send failed, sending as image:', stickerError);
                    // Fallback to image if sticker fails
                    await client.sendMessage(
                        m.chat,
                        {
                            image: { url: resultUrl },
                            caption: formatStylishReply(`Brat Image Created! 🖼️\nText: "${text}"`)
                        },
                        { quoted: m }
                    );
                }
            } else if (resultUrl.match(/\.(mp4|webm|gif)$/i)) {
                // It's a video/GIF
                await client.sendMessage(
                    m.chat,
                    {
                        video: { url: resultUrl },
                        caption: formatStylishReply(`Brat Video Created! 🎬\nText: "${text}"`)
                    },
                    { quoted: m }
                );
            } else {
                // Unknown format or text response - send as text
                await client.sendMessage(
                    m.chat,
                    {
                        text: formatStylishReply(`Brat Result: ${resultUrl}\n\nText: "${text}"`)
                    },
                    { quoted: m }
                );
            }

        } catch (error) {
            console.error('Brat command error:', error);
            
            // Try to delete loading message
            try {
                await client.sendMessage(m.chat, { 
                    delete: loadingMsg.key 
                });
            } catch (e) {
                // Ignore delete errors
            }

            let errorMessage = 'An unexpected error occurred';
            
            if (error.message.includes('Failed to generate')) {
                errorMessage = 'The brat generator failed to create your sticker.';
            } else if (error.message.includes('Network Error') || error.message.includes('fetch')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (error.message.includes('timeout')) {
                errorMessage = 'Request timed out. Try again later.';
            } else {
                errorMessage = error.message;
            }

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Brat Creation Failed! 😤\nError: ${errorMessage}\n\nTry again with different text.`)
            }, { quoted: m });
        }
    }
};