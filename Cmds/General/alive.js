const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, prefix, pict, botname } = context;

    if (!botname) {
        console.error(`Botname not set, you useless fuck.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!pict) {
        console.error(`Pict not set, you brain-dead moron.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No image to send, you idiot. Fix your shitty context.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, *${botname}* is alive and ready to fuck shit up! 🖕\n\nType *${prefix}menu* to see what I can do, you pathetic loser.\n◈━━━━━━━━━━━━━━━━◈\nPowered by *xh_clinton*, ‘cause you’re too dumb to code`;

        // Send the image with caption
        await client.sendMessage(m.chat, {
            image: { url: pict },
            caption: caption
        }, { quoted: m });

        // Try multiple possible paths for the audio file
        const possibleAudioPaths = [
            path.join(__dirname, 'xh_clinton', 'test.mp3'),
            path.join(process.cwd(), 'xh_clinton', 'test.mp3'),
            path.join(__dirname, '..', 'xh_clinton', 'test.mp3'),
        ];

        let audioPath = null;
        for (const possiblePath of possibleAudioPaths) {
            try {
                await fs.promises.access(possiblePath, fs.constants.R_OK);
                audioPath = possiblePath;
                break;
            } catch {
                continue;
            }
        }

        if (audioPath) {
            console.log(`✅ Found audio file at: ${audioPath}`);
            await client.sendMessage(m.chat, {
                audio: { url: audioPath },
                ptt: true,
                mimetype: 'audio/mpeg',
                fileName: 'menu.mp3'
            }, { quoted: m });
        } else {
            console.error('❌ Audio file not found at any of the following paths:', possibleAudioPaths);
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Fuck, ${m.pushName}, couldn’t find the voice note. Check xh_clinton/menu.mp3, you incompetent shit.\n◈━━━━━━━━━━━━━━━━◈`);
        }

    } catch (error) {
        console.error(`Alive command fucked up: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}. Couldn’t check status or send the voice note. Error: ${error.message}. Try later, loser.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};