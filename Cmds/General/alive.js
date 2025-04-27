const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, prefix, pict, botname } = context;

    if (!botname) {
        console.error(`Botname not set, you useless fuck.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot's fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!pict) {
        console.error(`Pict not set, you brain-dead moron.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No image to send, you idiot. Fix your shitty context.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, *${botname}* is alive and ready to fuck shit up! 🖕\n│❒ \n│❒ Type *${prefix}menu* to see what I can do, you pathetic loser.\n◈━━━━━━━━━━━━━━━━◈\n│❒ Powered by *xh_clinton*, 'cause you're too dumb to code`;

        // Send the image with toxic caption
        await client.sendMessage(m.chat, {
            image: { url: pict },
            caption: caption,
            mentions: [m.sender]
        }, { quoted: m });

        // Audio file paths with extra toxicity
        const possibleAudioPaths = [
            path.join(__dirname, 'xh_clinton', 'test.mp3'),
            path.join(process.cwd(), 'xh_clinton', 'test.mp3'),
            path.join(__dirname, '..', 'xh_clinton', 'test.mp3'),
        ];

        let audioFound = false;
        for (const audioPath of possibleAudioPaths) {
            try {
                if (fs.existsSync(audioPath)) {
                    await client.sendMessage(m.chat, {
                        audio: { url: audioPath },
                        ptt: true,
                        mimetype: 'audio/mpeg',
                        fileName: 'fuck-you.mp3'
                    }, { quoted: m });
                    audioFound = true;
                    break;
                }
            } catch (err) {
                console.error(`Failed to send audio from ${audioPath}:`, err);
            }
        }

        if (!audioFound) {
            console.error('❌ Audio file not found at any path, you incompetent dev');
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ FUCK! ${m.pushName}, couldn't find the voice note.\n│❒ Check xh_clinton/test.mp3, you worthless piece of shit.\n◈━━━━━━━━━━━━━━━━◈`);
        }

    } catch (error) {
        console.error(`ALIVE COMMAND CRASHED LIKE YOUR LIFE:`, error);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ SHIT BROKE, ${m.pushName}!\n│❒ Error: ${error.message}\n│❒ Try again when you grow a brain, loser.\n◈━━━━━━━━━━━━━━━━◈`);
    }
};