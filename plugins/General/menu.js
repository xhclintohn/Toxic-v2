const fs = require('fs');
const path = require('path');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
    name: 'menu',
    aliases: ['commands', 'list'],
    description: 'Displays the Toxic-MD command menu',
    run: async (context) => {
        const { client, m, mode, pict, botname, prefix } = context;
        const fq = getFakeQuoted(m);

        await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

        const bodyText = m.body || '';
        const cleanText = bodyText.trimStart().slice(prefix.length).trimStart();

        if (cleanText !== '' && !['menu', 'commands', 'list'].includes(cleanText.split(' ')[0].toLowerCase())) {
            const commandName = cleanText.split(' ')[0];
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Yo ${m.pushName}, chill.\n├ Extra trash after "${commandName}"?\n├ Just type *${prefix}menu* properly.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }

        const menuText =
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ Mᴇɴᴜ ≪───\n` +
            `├ \n` +
            `├ Hello, @${m.pushName}\n` +
            `├ \n` +
            `├ Bot: TOXIC-MD\n` +
            `├ Prefix: ${prefix}\n` +
            `├ Mode: ${mode}\n` +
            `├ \n` +
            `├ Pick a category below or open GitHub.\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        const sections = [
            {
                title: '⌜ Core Commands ⌟',
                highlight_label: '',
                rows: [
                    { header: 'Full Menu', title: 'FullMenu', description: 'All commands list', id: `${prefix}fullmenu` },
                    { header: 'Dev', title: 'Dev', description: 'Developer contact', id: `${prefix}dev` },
                    { header: 'Report', title: 'Report', description: 'Report a bug to dev', id: `${prefix}report` },
                ],
            },
            {
                title: 'ℹ Bot Info',
                highlight_label: '',
                rows: [
                    { header: 'Ping', title: 'Ping', description: 'Check bot speed', id: `${prefix}ping` },
                    { header: 'Settings', title: 'Settings', description: 'Bot settings', id: `${prefix}settings` },
                    { header: 'Mode', title: 'Mode', description: 'Toggle bot mode', id: `${prefix}mode` },
                ],
            },
            {
                title: '📜 Category Menus',
                highlight_label: '',
                rows: [
                    { header: 'GeneralMenu', title: 'GeneralMenu', description: 'General commands', id: `${prefix}generalmenu` },
                    { header: 'SettingsMenu', title: 'SettingsMenu', description: 'Settings commands', id: `${prefix}settingsmenu` },
                    { header: 'OwnerMenu', title: 'OwnerMenu', description: 'Owner-only commands', id: `${prefix}ownermenu` },
                    { header: 'GroupMenu', title: 'GroupMenu', description: 'Group management', id: `${prefix}groupmenu` },
                    { header: 'AIMenu', title: 'AIMenu', description: 'AI-powered commands', id: `${prefix}aimenu` },
                    { header: 'DownloadMenu', title: 'DownloadMenu', description: 'Download commands', id: `${prefix}downloadmenu` },
                    { header: 'EditingMenu', title: 'EditingMenu', description: 'Image/video editing', id: `${prefix}editingmenu` },
                    { header: 'EffectsMenu', title: 'EffectsMenu', description: 'Text effect commands', id: `${prefix}effectsmenu` },
                    { header: 'AnimeMenu', title: 'AnimeMenu', description: 'Anime image commands', id: `${prefix}animemenu` },
                    { header: 'UtilsMenu', title: 'UtilsMenu', description: 'Utility tools', id: `${prefix}utilsmenu` },
                    { header: 'ReactionsMenu', title: 'ReactionsMenu', description: 'Reaction commands', id: `${prefix}reactionsmenu` },
                    { header: 'PrivacyMenu', title: 'PrivacyMenu', description: 'Privacy settings', id: `${prefix}privacymenu` },
                ],
            },
        ];

        try {
            const msg = await generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                interactiveMessage: {
                    body: { text: menuText },
                    footer: { text: '' },
                    header: { hasMediaAttachment: false },
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: `${botname}`,
                            body: `Yo, ${m.pushName}! Ready to cause chaos?`,
                            mediaType: 1,
                            thumbnail: pict,
                            mediaUrl: '',
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                            showAdAttribution: false,
                            renderLargerThumbnail: false,
                        }
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '🌐 GitHub',
                                    url: 'https://github.com/xhclintohn/Toxic-MD',
                                    merchant_url: 'https://github.com/xhclintohn/Toxic-MD'
                                })
                            },
                            {
                                name: 'single_select',
                                buttonParamsJson: JSON.stringify({
                                    title: '📖 Browse Categories',
                                    sections
                                })
                            }
                        ],
                        messageParamsJson: ''
                    }
                }
            }), { quoted: fq, userJid: client.user.id });
            await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
        } catch {
            await client.sendMessage(m.chat, {
                image: pict,
                caption: menuText,
                mentions: [m.sender],
                contextInfo: {
                    externalAdReply: {
                        title: `${botname}`,
                        body: `Yo, ${m.pushName}! Ready to cause chaos?`,
                        mediaType: 1,
                        thumbnail: pict,
                        mediaUrl: '',
                        sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                        showAdAttribution: false,
                        renderLargerThumbnail: false,
                    }
                }
            }, { quoted: fq });
            await client.sendMessage(m.chat, {
                listMessage: {
                    title: 'VIEW OPTIONS',
                    description: 'Select a category to view its commands.',
                    buttonText: '📖 Browse Commands',
                    listType: 1,
                    sections: sections.map(s => ({
                        title: s.title,
                        rows: s.rows.map(r => ({ title: r.title, description: r.description, rowId: r.id }))
                    })),
                    footer: '',
                },
            }, { quoted: fq });
        }

        const xhClintonPaths = [
            path.join(__dirname, 'xh_clinton'),
            path.join(process.cwd(), 'xh_clinton'),
            path.join(__dirname, '..', 'xh_clinton')
        ];
        let audioFolder = null;
        for (const folderPath of xhClintonPaths) {
            if (fs.existsSync(folderPath)) { audioFolder = folderPath; break; }
        }
        if (!audioFolder) return;
        const menuFiles = ['menu1.mp3', 'menu2.mp3', 'menu3.mp3', 'menu4.mp3'];
        const possibleFiles = menuFiles.map(f => path.join(audioFolder, f)).filter(f => fs.existsSync(f));
        if (possibleFiles.length === 0) return;
        const randomFile = possibleFiles[Math.floor(Math.random() * possibleFiles.length)];
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
            const audioBuffer = fs.readFileSync(randomFile);
            await client.sendMessage(m.chat, { audio: audioBuffer, ptt: true, mimetype: 'audio/mpeg', fileName: 'toxic-menu.m4a' }, { quoted: fq });
        } catch {
            await client.sendMessage(m.chat, { audio: { url: randomFile }, ptt: true, mimetype: 'audio/mpeg', fileName: 'toxic-menu.m4a' }, { quoted: fq });
        }
    },
};
