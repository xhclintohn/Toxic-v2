const fs = require('fs');
const path = require('path');

module.exports = async (context) => {
    const { client, m, prefix, pict, botname } = context;

    if (!botname) {
        console.error(`Botname not set, you useless fuck.`);
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot's fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
        // Toxic caption stays
        const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo ${m.pushName}, *${botname}* is alive and ready to fuck shit up! 🖕\n│❒ Type *${prefix}menu* to see what I can do, loser.\n◈━━━━━━━━━━━━━━━━◈\n│❒ Powered by *xh_clinton* - because your brain is too lazy to code looser`;

        // Handle image properly - check if pict is buffer or URL
        let imageContent;
        if (Buffer.isBuffer(pict)) {
            imageContent = pict;
        } else if (typeof pict === 'string') {
            imageContent = { url: pict };
        } else {
            throw new Error("Invalid image format, dumbass");
        }

        // Send image first
        await client.sendMessage(m.chat, {
            image: imageContent,
            caption: caption
        }, { quoted: m });

        // Audio handling with PROPER path resolution
        const audioDir = path.join(__dirname, '..', 'xh_clinton');
        const audioPath = path.join(audioDir, 'test.mp3');

        if (fs.existsSync(audioPath)) {
            await client.sendMessage(m.chat, {
                audio: fs.readFileSync(audioPath),
                ptt: true,
                mimetype: 'audio/mpeg',
                fileName: 'test.mp3'
            }, { quoted: m });
        } else {
            console.error('❌ Audio file missing, you incompetent shit');
            await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Where the FUCK is xh_clinton/test.mp3? Can't even manage files properly!\n◈━━━━━━━━━━━━━━━━◈`);
        }

    } catch (error) {
        console.error(`Command exploded like your coding skills: ${error.stack}`);
        await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ SYSTEM MELTDOWN, ${m.pushName}!\n│❒ Error: ${error.message}\n│❒ Fix your shit or get fucked!\n◈━━━━━━━━━━━━━━━━◈`);
    }
};