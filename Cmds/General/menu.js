const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'menu',
    aliases: ['help', 'commands', 'list'],
    description: 'Displays the bot command menu with a voice note',
    run: async (context) => {
        const { client, m, totalCommands, mode, prefix, pict } = context;

        try {
            const categories = [
                { name: 'General', emoji: '📜' },
                { name: 'Settings', emoji: '🛠️' },
                { name: 'Owner', emoji: '👑' },
                { name: 'Heroku', emoji: '☁️' },
                { name: 'Wa-Privacy', emoji: '🔒' },
                { name: 'Groups', emoji: '👥' },
                { name: 'AI', emoji: '🧠' },
                { name: 'Media', emoji: '🎬' },
                { name: 'Editting', emoji: '✂️' },
                { name: 'Utils', emoji: '🔧' }
            ];

            const getGreeting = () => {
                const currentHour = DateTime.now().setZone('Africa/Nairobi').hour;
                if (currentHour >= 5 && currentHour < 12) return 'Good Morning 🌞';
                if (currentHour >= 12 && currentHour < 18) return 'Good Afternoon 🌞';
                if (currentHour >= 18 && currentHour < 22) return 'Good Evening 🌙';
                return 'Good Night 🌌';
            };

            const getCurrentTimeInNairobi = () => {
                return DateTime.now().setZone('Africa/Nairobi').toLocaleString(DateTime.TIME_SIMPLE);
            };

            const toFancyFont = (text, isUpperCase = false) => {
                const fonts = {
                    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌',
                    'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
                    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦',
                    'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳'
                };
                return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
                    .split('')
                    .map(char => fonts[char] || char)
                    .join('');
            };

            let menuText = `🌟 *𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3* 🌟\n`;
            menuText += `${getGreeting()}, *${m.pushName}!*\n\n`;
            menuText += `👤 *User*: ${m.pushName}\n`;
            menuText += `🤖 *Bot*: �{T𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3\n`;
            menuText += `📋 *Total Commands*: ${totalCommands}\n`;
            menuText += `🕒 *Time*: ${getCurrentTimeInNairobi()}\n`;
            menuText += `🔣 *Prefix*: ${prefix}\n`;
            menuText += `🌐 *Mode*: ${mode}\n`;
            menuText += `📚 *Library*: Baileys\n`;
            menuText += `\n◈━━━━━━━━━━━━━━━━◈\n\n`;

            menuText += `*📖 Command Menu*\n`;

            for (const category of categories) {
                const commandFiles = fs.readdirSync(`./Cmds/${category.name}`).filter(file => file.endsWith('.js'));
                if (commandFiles.length === 0) continue;

                const fancyCategory = toFancyFont(category.name, true);
                menuText += `\n─── ✦ *${fancyCategory} ${category.emoji}* ✦ ───\n`;

                for (const file of commandFiles) {
                    const commandName = file.replace('.js', '');
                    const fancyCommandName = toFancyFont(commandName);
                    menuText += `  ➤ *${fancyCommandName}*\n`;
                }
            }

            menuText += `\n◈━━━━━━━━━━━━━━━━◈\n`;
            menuText += `*Explore the power of 𝐓𝐎𝐗𝐈𝐂-MD 𝐕3!*\n`;
            menuText += `🍁🌬️\n`;

            // Send the menu text
            await client.sendMessage(m.chat, {
                text: menuText,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        title: `𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3`,
                        body: `Hello, ${m.pushName}! Ready to dive in?`,
                        thumbnail: pict,
                        sourceUrl: `https://github.com/xhclintohn/Toxic-v2`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            // Try multiple possible paths for the audio file
            const possibleAudioPaths = [
                path.join(__dirname, 'xh_clinton', 'menu.mp3'), // Relative to menu.js
                path.join(process.cwd(), 'xh_clinton', 'menu.mp3'), // Relative to project root
                path.join(__dirname, '..', 'xh_clinton', 'menu.mp3'), // One directory up
            ];

            let audioPath = null;
            for (const possiblePath of possibleAudioPaths) {
                if (fs.existsSync(possiblePath)) {
                    audioPath = possiblePath;
                    break;
                }
            }

            if (audioPath) {
                console.log(`✅ Found audio file at: ${audioPath}`);
                await client.sendMessage(m.chat, {
                    audio: { url: audioPath },
                    ptt: true, // Marks it as a voice note with waveform interface
                    mimetype: 'audio/mpeg',
                    fileName: 'menu.mp3'
                }, { quoted: m });
            } else {
                console.error('❌ Audio file not found at any of the following paths:', possibleAudioPaths);
                await client.sendMessage(m.chat, {
                    text: `⚠️ *Oops! Couldn’t send the menu voice note.* The audio file is missing.\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*`
                }, { quoted: m });
            }

        } catch (error) {
            console.error('Error generating menu or sending voice note:', error);
            await client.sendMessage(m.chat, {
                text: `⚠️ *Oops! Failed to load menu or voice note:* ${error.message}\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*`
            }, { quoted: m });
        }
    }
};