const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../database/config');

module.exports = {
    name: 'animemenu',
    aliases: ['animmenu', 'animelist'],
    description: 'Displays the Anime commands menu',
    run: async (context) => {
        const { client, m, pict, prefix } = context;

        const toFancyFont = (text) => {
            const fonts = {
                'a':'𝙖','b':'𝙗','c':'𝙘','d':'𝙙','e':'𝙚','f':'𝙛','g':'𝙜','h':'𝙝','i':'𝙞','j':'𝙟','k':'𝙠','l':'𝙡','m':'𝙢',
                'n':'𝙣','o':'𝙤','p':'𝙥','q':'𝙦','r':'𝙧','s':'𝙨','t':'𝙩','u':'𝙪','v':'𝙫','w':'𝙬','x':'𝙭','y':'𝙮','z':'𝙯'
            };
            return text.toLowerCase().split('').map(c => fonts[c] || c).join('');
        };

        const animeDir = path.join(__dirname, '..', 'Anime');
        let commandFiles = [];
        try { commandFiles = fs.readdirSync(animeDir).filter(f => f.endsWith('/js')); } catch {}

        let menuText = `╭───(    TOXIC-MD    )───\n├───≫ ANIMEMENU ≪───\n├ \n`;
        for (const file of commandFiles) {
            menuText += `├ *${toFancyFont(file.replace('/js', ''))}*\n`;
        }
        menuText += `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await client.sendMessage(m.chat, {
            text: menuText,
            contextInfo: {
                externalAdReply: {
                    title: 'TOXIC-MD — Anime',
                    body: 'Your anime fix, served toxic.',
                    mediaType: 1,
                    thumbnail: pict,
                    sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                    showAdAttribution: false,
                    renderLargerThumbnail: false,
                }
            }
        }, { quoted: m });
    }
};
