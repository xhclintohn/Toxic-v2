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

        const text = m.body.replace(new RegExp(`^${prefix}(brat|bratsticker|brattext)\\s*`, 'i'), '').trim();
        
        if (!text) {
            return client.sendMessage(m.chat, {
                text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the text!\n│❒ Example: ${prefix}brat Hello there\n◈━━━━━━━━━━━━━━━━◈`,
                mentions: [m.sender]
            }, { quoted: m });
        }

        try {
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Creating brat sticker... 🎨\nText: "${text}"`)
            }, { quoted: m });

            const apiUrl = `https://api.ootaizumi.web.id/generator/brat?text=${encodeURIComponent(text)}`;
            
            // Get the image as buffer
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`API status: ${response.status}`);
            const imageBuffer = await response.buffer();

            // Delete loading message
            await client.sendMessage(m.chat, { delete: loadingMsg.key });

            /**
             * Send with proper sticker metadata
             */
            await client.sendMessage(
                m.chat,
                {
                    sticker: imageBuffer,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Brat Sticker',
                            body: `Text: ${text}`,
                            mediaType: 1,
                            thumbnail: imageBuffer,
                            sourceUrl: apiUrl,
                            renderLargerThumbnail: true
                        }
                    }
                },
                { quoted: m }
            );

        } catch (error) {
            console.error('Brat command error:', error);
            
            try {
                await client.sendMessage(m.chat, { delete: loadingMsg.key });
            } catch (e) {}
            
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Failed! 😤\nError: ${error.message}`)
            }, { quoted: m });
        }
    }
};