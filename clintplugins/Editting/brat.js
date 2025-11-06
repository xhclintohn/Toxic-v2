const fetch = require('node-fetch');
const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');

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
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the text!\n│❒ Example: ${prefix}brat Hello there\n◈━━━━━━━━━━━━━━━━◈`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            /**
             * Send loading message
             */
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Creating brat sticker... 🎨\nText: "${text}"`)
            }, { quoted: m });

            /**
             * Fetch from the API your friend used - it seems more reliable
             */
            const apiUrl = `https://api.nekolabs.web.id/canvas/brat/v1?text=${encodeURIComponent(text)}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            // Get image as buffer
            const buffer = Buffer.from(await response.arrayBuffer());

            // Delete loading message
            await client.sendMessage(m.chat, { 
                delete: loadingMsg.key 
            });

            /**
             * Create proper sticker with metadata using wa-sticker-formatter
             */
            const sticker = new Sticker(buffer, {
                pack: 'Brat Sticker Pack',      // Sticker pack name
                author: 'Toxic Bot',            // Author name
                type: StickerTypes.FULL,        // Sticker type
                categories: ['😎', '💬'],       // Categories
                quality: 50,                    // Quality
                background: 'transparent'       // Background
            });

            // Send the sticker
            await client.sendMessage(m.chat, await sticker.toMessage(), { quoted: m });

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

            let errorMessage = 'Failed to create sticker';
            
            if (error.message.includes('status')) {
                errorMessage = 'Brat API is not responding. Try again later.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Check your connection.';
            } else {
                errorMessage = error.message;
            }

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Brat Creation Failed! 😤\nError: ${errorMessage}`)
            }, { quoted: m });
        }
    }
};