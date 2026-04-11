const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../database/config');
const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');

module.exports = {
    name: 'menu',
    aliases: ['help', 'commands', 'list'],
    description: 'Displays the Toxic-MD command menu',
    run: async (context) => {
        const { client, m, mode, pict, botname, prefix } = context;

        await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

        const bodyText = m.body || '';
        const cleanText = bodyText.trimStart().slice(prefix.length).trimStart();

        if (cleanText !== '' && !['menu', 'help', 'commands', 'list'].includes(cleanText.split(' ')[0].toLowerCase())) {
            const commandName = cleanText.split(' ')[0];
            await client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Yo ${m.pushName}, what's with the\n├ extra bullshit after "${commandName}"?\n├ Just type *${prefix}menu* properly, moron.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: m });
            return;
        }

        const settings = await getSettings();
        const effectivePrefix = settings.prefix || '.';

        const menuText =
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ Mᴇɴᴜ ≪───\n` +
            `├ \n` +
            `├ Hello, @${m.pushName}\n` +
            `├ \n` +
            `├ Bot: TOXIC-MD\n` +
            `├ Prefix: ${effectivePrefix}\n` +
            `├ Mode: ${mode}\n` +
            `├ \n` +
            `├ Pick a category below or open GitHub.\n` +
            `╰──────────────────☉\n` +
            `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await client.sendMessage(m.chat, {
            image: pict,
            caption: menuText,
            mentions: [m.sender],
            contextInfo: {
                externalAdReply: {
                    title: `${botname}`,
                    body: `Yo, ${m.pushName}! Ready to fuck shit up?`,
                    mediaType: 1,
                    thumbnail: pict,
                    mediaUrl: '',
                    sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                    showAdAttribution: false,
                    renderLargerThumbnail: false,
                },
            },
        }, { quoted: m });

        const sections = [
            {
                title: '⌜ Core Commands ⌟',
                highlight_label: '',
                rows: [
                    { header: 'Full Menu', title: 'FullMenu', description: 'All commands list', id: `${effectivePrefix}fullmenu` },
                    { header: 'Dev', title: 'Dev', description: 'Developer contact', id: `${effectivePrefix}dev` },
                    { header: 'Report', title: 'Report', description: 'Report a bug to dev', id: `${effectivePrefix}report` },
                ],
            },
            {
                title: 'ℹ Bot Info',
                highlight_label: '',
                rows: [
                    { header: 'Ping', title: 'Ping', description: 'Check bot speed', id: `${effectivePrefix}ping` },
                    { header: 'Settings', title: 'Settings', description: 'Bot settings', id: `${effectivePrefix}settings` },
                    { header: 'Mode', title: 'Mode', description: 'Toggle bot mode', id: `${effectivePrefix}mode` },
                ],
            },
            {
                title: '📜 Category Menus',
                highlight_label: '',
                rows: [
                    { header: 'GeneralMenu', title: 'GeneralMenu', description: 'General commands', id: `${effectivePrefix}generalmenu` },
                    { header: 'SettingsMenu', title: 'SettingsMenu', description: 'Settings commands', id: `${effectivePrefix}settingsmenu` },
                    { header: 'OwnerMenu', title: 'OwnerMenu', description: 'Owner only commands', id: `${effectivePrefix}ownermenu` },
                    { header: 'PrivacyMenu', title: 'PrivacyMenu', description: 'Privacy commands', id: `${effectivePrefix}privacymenu` },
                    { header: 'GroupMenu', title: 'GroupMenu', description: 'Group management', id: `${effectivePrefix}groupmenu` },
                    { header: 'AIMenu', title: 'AIMenu', description: 'AI & chat commands', id: `${effectivePrefix}aimenu` },
                    { header: 'DownloadMenu', title: 'DownloadMenu', description: 'Media downloaders', id: `${effectivePrefix}downloadmenu` },
                    { header: 'EditingMenu', title: 'EditingMenu', description: 'Media editing tools', id: `${effectivePrefix}editingmenu` },
                    { header: 'LogoMenu', title: 'LogoMenu', description: 'Logo & text effects', id: `${effectivePrefix}logomenu` },
                    { header: '+18Menu', title: '+18Menu', description: 'NSFW (18+)', id: `${effectivePrefix}+18menu` },
                    { header: 'UtilsMenu', title: 'UtilsMenu', description: 'Utility commands', id: `${effectivePrefix}utilsmenu` },
                    { header: 'ReactionsMenu', title: 'ReactionsMenu', description: 'Reaction commands', id: `${effectivePrefix}reactionsmenu` },
                ],
            },
        ];

        try {
            const interactiveMsg = generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                interactiveMessage: {
                    body: { text: '🌐 GitHub  |  📖 Browse Categories' },
                    footer: { text: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' },
                    header: { hasMediaAttachment: false },
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
                                    sections: sections
                                })
                            }
                        ],
                        messageParamsJson: ''
                    }
                }
            }), { quoted: m, userJid: client.user.id });

            await client.relayMessage(m.chat, interactiveMsg.message, { messageId: interactiveMsg.key.id });
        } catch {
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
                    footer: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
                },
            }, { quoted: m });
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
            await client.sendMessage(m.chat, { audio: audioBuffer, ptt: true, mimetype: 'audio/mpeg', fileName: 'toxic-menu.m4a' }, { quoted: m });
        } catch {
            await client.sendMessage(m.chat, { audio: { url: randomFile }, ptt: true, mimetype: 'audio/mpeg', fileName: 'toxic-menu.m4a' }, { quoted: m });
        }
    },
};
