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

        // Extract command arguments
        const args = m.body.replace(new RegExp(`^${prefix}(xreact|engagement|autoreact|whatsappreact)\\s*`, 'i'), '').trim();
        
        if (!args) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Please provide link and emojis!\n\nUsage:\n${prefix}xreact https://whatsapp.com/channel/0029VagJlnG6xCSU2tS1Vz19/1731 ❤️,😘,👍\n\nFormat: ${prefix}xreact <link_with_message_id> <emojis>`)
            }, { quoted: m });
        }

        // Improved parsing: Split by first space to separate link from emojis
        const firstSpaceIndex = args.indexOf(' ');
        if (firstSpaceIndex === -1) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Invalid format! Provide both link and emojis.\n\nExample:\n${prefix}xreact https://whatsapp.com/channel/0029VagJlnG6xCSU2tS1Vz19/1731 ❤️,😘,👍`)
            }, { quoted: m });
        }

        let link = args.substring(0, firstSpaceIndex).trim();
        const emojis = args.substring(firstSpaceIndex + 1).trim();

        // Add protocol if missing
        if (!link.startsWith('http')) {
            link = 'https://' + link;
        }

        // Validate it's a WhatsApp channel link with message ID
        if (!link.includes('whatsapp.com/channel/') || !link.match(/\/\d+$/)) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Invalid WhatsApp channel link!\n\nMust include message ID:\n${prefix}xreact https://whatsapp.com/channel/0029VagJlnG6xCSU2tS1Vz19/1731 ❤️,😘,👍\n\nNote: Link must end with /message_id`)
            }, { quoted: m });
        }

        if (!emojis) {
            return client.sendMessage(m.chat, {
                text: formatStylishReply(`Missing emojis!\n\nExample:\n${prefix}xreact ${link} ❤️,😘,👍`)
            }, { quoted: m });
        }

        try {
            const loadingMsg = await client.sendMessage(m.chat, {
                text: formatStylishReply(`Sending reactions... ⚡\nLink: ${link}\nEmojis: ${emojis}\nPlease wait...`)
            }, { quoted: m });

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

            await client.sendMessage(m.chat, {
                text: formatStylishReply(`✅ ${data.message}\n\n📌 Channel Link:\n${data.channel_link}\n\n🎭 Emojis Used:\n${data.emoji}\n\n⚡ Engagement: +1.1k\n\nPowered by Toxic-MD`)
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
                text: formatStylishReply(`Engagement Failed! 😤\nError: ${errorMessage}\n\nTips:\n• Check if the link has message ID (/12345)\n• Ensure emojis are separated by commas\n• Make sure the channel is public\n• API limit might be reached (200/day)`)
            }, { quoted: m });
        }
    }
};