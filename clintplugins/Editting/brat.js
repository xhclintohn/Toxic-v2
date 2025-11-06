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
             * Call the brat API - it returns image directly, not JSON
             */
            const apiUrl = `https://api.ootaizumi.web.id/generator/brat?text=${encodeURIComponent(text)}`;
            
            // First, try to get the image as buffer
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            // Get the image buffer
            const imageBuffer = await response.buffer();

            // Delete loading message
            await client.sendMessage(m.chat, { 
                delete: loadingMsg.key 
            });

            /**
             * Try to send as sticker first, then fallback to image
             */
            try {
                await client.sendMessage(
                    m.chat,
                    {
                        sticker: imageBuffer,
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
                        image: imageBuffer,
                        caption: formatStylishReply(`Brat Image Created! 🖼️\nText: "${text}"`)
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
            
            if (error.message.includes('status')) {
                errorMessage = 'The brat generator API is not responding properly.';
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