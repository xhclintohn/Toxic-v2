import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { getSettings } from '../../database/config.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default {
    name: 'start',
    aliases: ['alive', 'online', 'toxic'],
    description: 'Check if bot is alive',
    run: async (context) => {
        const { client, m, mode, pict, botname, text, prefix } = context;
        const fq = getFakeQuoted(m);

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        await client.sendMessage(m.chat, { react: { text: '🤖', key: m.reactKey } });

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
                        text: `╭───(    TOXIC-MD    )───\n├───≫ Sᴛᴀʀᴛ ≪───\n├ \n├ Yo @${m.sender.split('@')[0].split(':')[0]}! You actually bothered\n├ to check if I'm alive?\n├ ${botname} is active 24/7, unlike\n├ your brain cells.\n├ Stop wasting my time and pick\n├ something useful below.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
                    },
                    nativeFlowMessage: {
                        messageVersion: 1,
                        buttons: [
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: 'Menu', id: `${effectivePrefix}menu` })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: 'Ping', id: `${effectivePrefix}ping` })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: 'Settings', id: `${effectivePrefix}settings` })
                            }
                        ]
                    }
                }
            },
            { quoted: fq }
        );

        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    },
};
