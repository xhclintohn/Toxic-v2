const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { getSettings } = require('../../database/config');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'start',
    aliases: ['alive', 'online', 'toxic'],
    description: 'Check if bot is alive',
    run: async (context) => {
        const { client, m, mode, pict, botname, text, prefix } = context;
        const fq = getFakeQuoted(m);

        await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

        const xhClintonPaths = [
            path.join(__dirname, 'xh_clinton'),
            path.join(process.cwd(), 'xh_clinton'),
            path.join(__dirname, '..', 'xh_clinton')
        ];

        let audioFolder = null;
        for (const folderPath of xhClintonPaths) {
            if (fs.existsSync(folderPath)) {
                audioFolder = folderPath;
                break;
            }
        }

        if (audioFolder) {
            const possibleFiles = [];
            for (let i = 1; i <= 10; i++) {
                const fileName = `menu${i}`;
                const audioExtensions = ['.mp3', '.m4a', '.ogg', '.opus', '.wav'];
                
                for (const ext of audioExtensions) {
                    const fullPath = path.join(audioFolder, fileName + ext);
                    if (fs.existsSync(fullPath)) {
                        possibleFiles.push(fullPath);
                    }
                }
            }

            if (possibleFiles.length > 0) {
                const randomFile = possibleFiles[Math.floor(Math.random() * possibleFiles.length)];
                await client.sendMessage(
                    m.chat,
                    {
                        audio: { url: randomFile },
                        ptt: true,
                        mimetype: 'audio/mpeg',
                        fileName: 'toxic-start.mp3',
                    },
                    { quoted: fq }
                );
            }
        }

        const settings = await getSettings();  
        const effectivePrefix = settings.prefix || '.';

        const msg = generateWAMessageFromContent(  
            m.chat,  
            {  
                interactiveMessage: {  
                    body: { 
                        text: `╭───(    TOXIC-MD    )───\n├───≫ Sᴛᴀʀᴛ ≪───\n├ \n├ Yo @${m.pushName}! You actually bothered\n├ to check if I'm alive?\n├ ${botname} is active 24/7, unlike\n├ your brain cells.\n├ Stop wasting my time and pick\n├ something useful below.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` 
                    },  
                    nativeFlowMessage: {  
                        buttons: [  
                            {  
                                name: 'single_select',  
                                buttonParamsJson: JSON.stringify({  
                                    title: '𝐖𝐇𝐀𝐓 𝐃𝐎 𝐘𝐎𝐔 𝐖𝐀𝐍𝐓?',  
                                    sections: [  
                                        {  
                                            rows: [  
                                                { title: '📱 Menu', description: 'Get all commands', id: `${effectivePrefix}menu` },  
                                                { title: '⚙ Settings', description: 'Bot settings', id: `${effectivePrefix}settings` },  
                                                { title: '🏓 Ping', description: 'Check bot speed', id: `${effectivePrefix}ping` },  
                                                { title: '🔄 Update', description: 'Check for updates', id: `${effectivePrefix}update` },  
                                            ],  
                                        },  
                                    ],  
                                }),  
                            },  
                        ],  
                    },  
                },  
            },  
            { quoted: fq }  
        );  

        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    },
};
