const fetch = require('node-fetch');

module.exports = {
    name: 'xreact',
    aliases: ['engagement', 'autoreact', 'whatsappreact'],
    description: 'Auto-reacts to WhatsApp channel posts',
    run: async (context) => {
        const { client, m, prefix } = context;

        const formatStylishReply = (message) => {
            return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
        };

        /**
         * Extract link and emojis from message - FIXED VERSION
         */
        const fullText = m.body.replace(new RegExp(`^${prefix}(xreact|engagement|autoreact|whatsappreact)\\s*`, 'i'), '').trim();
        
        if (!fullText) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Please provide link and emojis!\n\nUsage:\n${prefix}xreact https://whatsapp.com/channel/0029Vb6dsyP3rZZgNJUD2F1A ❤️,😘,👍\n\nFormat: ${prefix}xreact <link> <emojis>`)
            }, { quoted: m });
        }

        // Better parsing: find the first URL and everything after it are emojis
        const urlMatch = fullText.match(/(https?:\/\/[^\s]+)/);
        
        if (!urlMatch) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`No valid URL found!\n\nExample:\n${prefix}xreact https://whatsapp.com/channel/0029Vb6dsyP3rZZgNJUD2F1A ❤️,😘,👍`)
            }, { quoted: m });
        }

        const link = urlMatch[0];
        const emojis = fullText.replace(link, '').trim();

        if (!emojis) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Missing emojis!\n\nExample:\n${prefix}xreact ${link} ❤️,😘,👍`)
            }, { quoted: m });
        }

        try {
            /**
             * Send loading message
             */
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Sending reactions... ⚡\nLink: ${link}\nEmojis: ${emojis}\nPlease wait...`)
            }, { quoted: m });

            /**
             * Call the engagement API
             */
            const apiUrl = `https://obito-mr-apis.vercel.app/api/tools/like_whatssap?link=${encodeURIComponent(link)}&emoji=${encodeURIComponent(emojis)}`;
            
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`API returned status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'API response failed');
            }

            // Delete loading message
            await client.sendMessage(m.chat, { 
                delete: loadingMsg.key 
            });

            /**
             * Send success result
             */
            await client.sendMessage(m.chat, {
                text: formatStylishReply(`✅ ${data.message}\n\n📌 Channel Link:\n${data.channel_link}\n\n🎭 Emojis Used:\n${data.emoji}\n\n⚡ Engagement: +1.1k\n\nPowered by Obito API`)
            }, { quoted: m });

        } catch (error) {
            console.error('XReact command error:', error);
            
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
                errorMessage = 'Engagement API is not responding.';
            } else if (error.message.includes('Network')) {
                errorMessage = 'Network error. Check your connection.';
            } else if (error.message.includes('API response failed')) {
                errorMessage = 'The engagement service failed.';
            } else {
                errorMessage = error.message;
            }

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`Engagement Failed! 😤\nError: ${errorMessage}\n\nTips:\n• Check if the link is valid\n• Ensure emojis are separated by commas\n• Make sure the channel is public\n• API limit might be reached (200/day)`)
            }, { quoted: m });
        }
    }
};