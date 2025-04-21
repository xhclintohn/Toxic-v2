const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, prefix, pict } = context;

    try {
        const caption = `🟢 *Hello ${m.pushName}, 𝐓𝐎𝐗𝐈𝐂-𝐌𝐃 𝐕3 is online!*\n\nType *${prefix}menu* to explore my commands.\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*`;

        // Send the image with caption
        await client.sendMessage(m.chat, {
            image: pict, // Assuming pict is provided in context; replace with local image path if needed
            caption: caption
        }, { quoted: m });

        // Try multiple possible paths for the audio file
        const possibleAudioPaths = [
            path.join(__dirname, 'xh_clinton', 'menu.mp3'), // Relative to alive.js
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
                text: `⚠️ *Oops! Couldn’t send the voice note.* The audio file is missing.\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐱𝐡_�{c𝐥𝐢𝐧𝐭𝐨𝐧*`
            }, { quoted: m });
        }

    } catch (error) {
        console.error('Error in alive command:', error);
        await client.sendMessage(m.chat, {
            text: `⚠️ *Oops! Failed to check status or send voice note:* ${error.message}\n\n◈━━━━━━━━━━━━━━━━◈\nPowered by *𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧*`
        }, { quoted: m });
    }
};