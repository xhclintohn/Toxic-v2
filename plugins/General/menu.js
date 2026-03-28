const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const { getSettings } = require('../../database/config');

module.exports = {
    name: 'menu',
    aliases: ['help', 'commands', 'list'],
    description: 'Displays the Toxic-MD command menu with interactive buttons',
    run: async (context) => {
        const { client, m, mode, pict, botname, prefix } = context;

        const pref = prefix;
        const command = m.body.trimStart().slice(pref.length).split(' ')[0].toLowerCase();

        if (command === 'menu' || command === `${pref}menu`) {
            await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

            const settings = await getSettings();
            const toxicWebsite = 'https://github.com/xhclintohn/Toxic-MD';
            const buuLwork = "✅WORK";

            const menuText = `╭───(    TOXIC-MD    )───\n├───≫ Mᴇɴᴜ ≪───\n├ \n├ Hello, @${m.pushName}\n├ \n├ Bot: TOXIC-MD\n├ Prefix: ${pref}\n├ Mode: ${mode}\n├ \n├ Select a button below.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

            const buttonsCard1 = [
                {
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: "⛩️MAIN MENU🐉",
                        sections: [{
                            title: "⛩️MAIN MENU🐉",
                            rows: [
                                { title: "🫟BOT INFO🫟", rows: [] },
                                { title: "🫟VERSION: 1.0.0🫟", rows: [] },
                                { title: `🐦‍🔥STATUS🔥 : ${buuLwork}`, description: "CHECK BOT STATUS", id: `${pref}status` },
                                { title: "🫟OWNER INFO🫟", rows: [] },
                                { title: "🫟HONNEYBUU MODZ🫟", rows: [] },
                                { title: `🐦‍🔥CONTACT🔥 : ${buuLwork}`, description: "OWNER NUMBER", id: `${pref}owner` },
                                { title: "🫟SCAN GROUPS🫟", rows: [] },
                                { title: "🫟CHECK OWNER🫟", rows: [] },
                                { title: `🐦‍🔥SCAN🔥 : ${buuLwork}`, description: "RESCAN GROUPS", id: `${pref}scan` },
                                { title: "🫟PING🫟", rows: [] },
                                { title: "🫟CHECK LATENCY🫟", rows: [] },
                                { title: `🏓PING🏓 : ${buuLwork}`, description: "CHECK BOT RESPONSE", id: `${pref}ping` },
                            ]
                        }]
                    })
                },
                {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: "⛩️VISIT WEBSITE🐉",
                        url: toxicWebsite,
                        merchant_url: toxicWebsite
                    })
                }
            ];

            const msg = generateWAMessageFromContent(
                m.chat,
                {
                    interactiveMessage: {
                        header: {
                            documentMessage: {
                                url: 'https://mmg.whatsapp.net/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc?ccb=11-4&oh=01_Q5Aa2QGGiJj--6eHxoTTTTzuWtBgCrkcXBz9hN_y2s_Z1lrABA&oe=68D7901C&_nc_sid=5e03e0&mms3=true',
                                mimetype: 'image/png',
                                fileSha256: '+gmvvCB6ckJSuuG3ZOzHsTBgRAukejv1nnfwGSSSS/4=',
                                fileLength: '1435',
                                pageCount: 0,
                                mediaKey: 'MWO6fI223TY8T0i9onNcwNBBPldWfwp1j1FPKCiJFzw=',
                                fileName: 'Toxic-MD',
                                fileEncSha256: 'ZS8v9tio2un1yWVOOG3lwBxiP+mNgaKPY9+wl5pEoi8=',
                                directPath: '/v/t62.7119-24/539012045_745537058346694_1512031191239726227_n.enc?ccb=11-4&oh=01_Q5Aa2QGGiJj--6eHxoTTTTzuWtBgCrkcXBz9hN_y2s_Z1lrABA&oe=68D7901C&_nc_sid=5e03e0',
                                mediaKeyTimestamp: '1756370084',
                                jpegThumbnail: pict,
                            },
                            hasMediaAttachment: true,
                        },
                        body: { text: menuText },
                        footer: { text: `靛` },
                        nativeFlowMessage: {
                            buttons: buttonsCard1,
                            messageParamsJson: JSON.stringify({
                                limited_time_offer: {
                                    text: 'Toxic-MD',
                                    url: toxicWebsite,
                                    copy_code: 'TOXIC',
                                    expiration_time: Date.now() * 1000,
                                },
                                bottom_sheet: {
                                    in_thread_buttons_limit: 2,
                                    divider_indices: [1, 2],
                                    list_title: 'Select Command',
                                    button_title: 'Toxic-MD',
                                },
                            }),
                        },
                        contextInfo: {
                            externalAdReply: {
                                title: `${botname}`,
                                body: `Yo, ${m.pushName}! Ready to fuck shit up?`,
                                mediaType: 1,
                                thumbnail: pict,
                                mediaUrl: '',
                                sourceUrl: toxicWebsite,
                                showAdAttribution: false,
                                renderLargerThumbnail: true,
                            },
                        },
                    },
                },
                { quoted: m }
            );

            await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

            // Audio handling
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

            if (!audioFolder) return;

            const menuFiles = ['menu1.mp3', 'menu2.mp3', 'menu3.mp3', 'menu4.mp3'];
            const possibleFiles = menuFiles
                .map(fileName => path.join(audioFolder, fileName))
                .filter(fullPath => fs.existsSync(fullPath));

            if (possibleFiles.length === 0) return;

            const randomFile = possibleFiles[Math.floor(Math.random() * possibleFiles.length)];
            await new Promise(resolve => setTimeout(resolve, 500));

            try {
                const audioBuffer = fs.readFileSync(randomFile);
                await client.sendMessage(
                    m.chat,
                    {
                        audio: audioBuffer,
                        ptt: true,
                        mimetype: 'audio/mpeg',
                        fileName: 'toxic-menu.m4a',
                    },
                    { quoted: m }
                );
            } catch (error) {
                await client.sendMessage(
                    m.chat,
                    {
                        audio: { url: randomFile },
                        ptt: true,
                        mimetype: 'audio/mpeg',
                        fileName: 'toxic-menu.m4a',
                    },
                    { quoted: m }
                );
            }
        }
    },
};