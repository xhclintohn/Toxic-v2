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

        try {
            /**
             * Send loading message
             */
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Creating brat sticker... 🎨\nText: "${text}"\nPlease wait... ⏳`)
            }, { quoted: m });

            /**
             * Call the brat API - let it return whatever it wants
             */
            const apiUrl = `https://api.ootaizumi.web.id/generator/brat?text=${encodeURIComponent(text)}`;
            
            // Just fetch whatever the API returns
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            // Get whatever the API sends
            const resultBuffer = await response.buffer();

            // Delete loading message
            await client.sendMessage(m.chat, { 
                delete: loadingMsg.key 
            });

            /**
             * Just send whatever the API returns without any processing
             */
            await client.sendMessage(
                m.chat,
                {
                    sticker: resultBuffer
                },
                { quoted: m }
            );

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

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Brat Creation Failed! 😤\nError: ${error.message}\n\nTry again with different text.`)
            }, { quoted: m });
        }
    }
};