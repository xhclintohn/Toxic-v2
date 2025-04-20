const { DateTime } = require('luxon');
const fs = require('fs');

module.exports = async (context) => {
    const { client, m, totalCommands, mode, prefix, pict } = context;

    try {
        const categories = [
            { name: 'General', emoji: '📜' }, // For general commands
            { name: 'Settings', emoji: '🛠️' }, // Tools for configuration
            { name: 'Owner', emoji: '👑' }, // Royalty for bot owner
            { name: 'Heroku', emoji: '☁️' }, // Cloud for Heroku-related
            { name: 'Wa-Privacy', emoji: '🔒' }, // Lock for privacy features
            { name: 'Groups', emoji: '👥' }, // People for group management
            { name: 'AI', emoji: '🧠' }, // Brain for AI-powered commands
            { name: 'Media', emoji: '🎬' }, // Clapperboard for media content
            { name: 'Editing', emoji: '✂️' }, // Scissors for editing tools
            { name: 'Utils', emoji: '🔧' } // Wrench for utility commands
        ];

        const getGreeting = () => {
            const currentHour = DateTime.now().setZone('Africa/Nairobi').hour;
            if (currentHour >= 5 && currentHour < 12) return 'Good morning 🌞';
            if (currentHour >= 12 && currentHour < 18) return 'Good afternoon 🌞';
            if (currentHour >= 18 && currentHour < 22) return 'Good evening 🌙';
            return 'Good night 🌌';
        };

        const getCurrentTimeInNairobi = () => {
            return DateTime.now().setZone('Africa/Nairobi').toLocaleString(DateTime.TIME_SIMPLE);
        };

        let menuText = `Hey there, ${getGreeting()}!\n\n`;
        menuText += `👤 𝐔𝐬𝐞𝐫: ${m.pushName}\n`;
        menuText += `🤖 𝐁𝐨𝐭: 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3\n`;
        menuText += `📋 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬: ${totalCommands}\n`;
        menuText += `🕒 𝐓𝐢𝐦𝐞: ${getCurrentTimeInNairobi()}\n`;
        menuText += `🔣 𝐏𝐫𝐞𝐟𝐢𝐱: ${prefix}\n`;
        menuText += `🌐 𝐌𝐨𝐝𝐞: ${mode}\n`;
        menuText += `📚 𝐋𝐢𝐛𝐫𝐚𝐫𝐲: Baileys\n`;
        menuText += '\n◈━━━━━━━━━━━━━━━━◈\n\n';

        const toLightUppercaseFont = (text) => {
            const fonts = {
                'A': '𝘈', 'B': '𝘉', 'C': '𝘊', 'D': '𝘋', 'E': '𝘌', 'F': '𝘍', 'G': '𝘎', 'H': '𝘏', 'I': '𝘐', 'J': '𝘑', 'K': '𝘒', 'L': '𝘓', 'M': '𝘔',
                'N': '𝘕', 'O': '𝘖', 'P': '𝘗', 'Q': '𝘘', 'R': '𝘙', 'S': '𝘚', 'T': '𝘛', 'U': '𝘜', 'V': '𝘝', 'W': '𝘞', 'X': '𝘟', 'Y': '𝘠', 'Z': '𝘡'
            };
            return text.toUpperCase().split('').map(char => fonts[char] || char).join('');
        };

        const toLightLowercaseFont = (text) => {
            const fonts = {
                'a': '𝘢', 'b': '𝘣', 'c': '𝘤', 'd': '𝘥', 'e': '𝘦', 'f': '𝘧', 'g': '𝘨', 'h': '𝘩', 'i': '𝘪', 'j': '𝘫', 'k': '𝘬', 'l': '𝘭', 'm': '𝘮',
                'n': '𝘯', 'o': '𝘰', 'p': '𝘱', 'q': '𝘲', 'r': '𝘳', 's': '𝘴', 't': '𝘵', 'u': '𝘶', 'v': '𝘷', 'w': '𝘸', 'x': '𝘹', 'y': '𝘺', 'z': '𝘻'
            };
            return text.toLowerCase().split('').map(char => fonts[char] || char).join('');
        };

        for (const category of categories) {
            const commandFiles = fs.readdirSync(`./Cmds/${category.name}`).filter(file => file.endsWith('.js'));
            if (commandFiles.length === 0) continue; // Skip empty categories

            const fancyCategory = toLightUppercaseFont(category.name);
            menuText += `📌 ${fancyCategory} ${category.emoji}\n`;
            for (const file of commandFiles) {
                const commandName = file.replace('.js', '');
                const fancyCommandName = toLightLowercaseFont(commandName);
                menuText += `  ➤ ${fancyCommandName}\n`;
            }
            menuText += '\n';
        }

        menuText += '◈━━━━━━━━━━━━━━━━◈\n';
        menuText += 'Powered by 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3';

        await client.sendMessage(m.chat, {
            text: menuText,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: false,
                    title: `𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3`,
                    body: `Hello, ${m.pushName}!`,
                    thumbnail: pict,
                    sourceUrl: `https://github.com/xhclintohn/Toxic-v2`,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m });

    } catch (error) {
        console.error('Error generating menu:', error);
        await client.sendMessage(m.chat, { text: `Oops! Something went wrong while fetching the menu: ${error.message}` }, { quoted: m });
    }
};