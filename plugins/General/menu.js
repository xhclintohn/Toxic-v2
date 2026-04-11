const fs = require('fs');
const path = require('path');
const { getSettings } = require('../../database/config');

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
            `├ 🔗 GitHub: https://github.com/xhclintohn/Toxic-MD\n` +
            `├ \n` +
            `├ Tap the button below to browse\n` +
            `├ or pick a category from the list.\n` +
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

        await client.sendMessage(m.chat, {
            listMessage: {
                title: '𝐕𝐈𝐄𝐖 𝐎𝐏𝐓𝐈𝐎𝐍𝐒',
                description: 'Select a category to view its commands.',
                buttonText: '📖 Browse Commands',
                listType: 1,
                sections: [
                    {
                        title: '⌜ 𝘾𝙤𝙧𝙚 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 ⌟',
                        rows: [
                            { title: '𝐅𝐮𝐥𝐥𝐌𝐞𝐧𝐮', description: 'Display all commands', rowId: `${effectivePrefix}fullmenu` },
                            { title: '𝐃𝐞𝐯', description: 'Send developer contact', rowId: `${effectivePrefix}dev` },
                        ],
                    },
                    {
                        title: 'ℹ 𝘽𝙤𝙩 𝙄𝙣𝙛𝙤',
                        rows: [
                            { title: '𝐏𝐢𝐧𝐠', description: 'Check bot speed', rowId: `${effectivePrefix}ping` },
                            { title: '𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬', description: 'Show bot settings', rowId: `${effectivePrefix}settings` },
                        ],
                    },
                    {
                        title: '📜 𝘾𝙖𝙩𝙚𝙜𝙤𝙧𝙮 𝙈𝙚𝙣𝙪𝙨',
                        rows: [
                            { title: '𝐆𝐞𝐧𝐞𝐫𝐚𝐥𝐌𝐞𝐧𝐮', description: 'General commands', rowId: `${effectivePrefix}generalmenu` },
                            { title: '𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬𝐌𝐞𝐧𝐮', description: 'Bot settings commands', rowId: `${effectivePrefix}settingsmenu` },
                            { title: '𝐎𝐰𝐧𝐞𝐫𝐌𝐞𝐧𝐮', description: 'Owner only commands', rowId: `${effectivePrefix}ownermenu` },
                            { title: '𝐏𝐚𝐧𝐞𝐥𝐌𝐞𝐧𝐮', description: 'Panel & settings commands', rowId: `${effectivePrefix}panelmenu` },
                            { title: '𝐏𝐫𝐢𝐯𝐚𝐜𝐲𝐌𝐞𝐧𝐮', description: 'Privacy commands', rowId: `${effectivePrefix}privacymenu` },
                            { title: '𝐆𝐫𝐨𝐮𝐩𝐌𝐞𝐧𝐮', description: 'Group management', rowId: `${effectivePrefix}groupmenu` },
                            { title: '𝐀𝐈𝐌𝐞𝐧𝐮', description: 'AI & chat commands', rowId: `${effectivePrefix}aimenu` },
                            { title: '𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐌𝐞𝐧𝐮', description: 'Media downloaders', rowId: `${effectivePrefix}downloadmenu` },
                            { title: '𝐄𝐝𝐢𝐭𝐢𝐧𝐠𝐌𝐞𝐧𝐮', description: 'Media editing tools', rowId: `${effectivePrefix}editingmenu` },
                            { title: '𝐋𝐨𝐠𝐨𝐌𝐞𝐧𝐮', description: 'Logo & text makers', rowId: `${effectivePrefix}logomenu` },
                            { title: '+𝟏𝟖𝐌𝐞𝐧𝐮', description: 'NSFW commands (18+)', rowId: `${effectivePrefix}+18menu` },
                            { title: '𝐔𝐭𝐢𝐥𝐬𝐌𝐞𝐧𝐮', description: 'Utility commands', rowId: `${effectivePrefix}utilsmenu` },
                            { title: '𝐑𝐞𝐚𝐜𝐭𝐢𝐨𝐧𝐬𝐌𝐞𝐧𝐮', description: 'Reaction commands', rowId: `${effectivePrefix}reactionsmenu` },
                        ],
                    },
                ],
                footer: '©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧',
            },
        }, { quoted: m });

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
            .map(f => path.join(audioFolder, f))
            .filter(f => fs.existsSync(f));

        if (possibleFiles.length === 0) return;

        const randomFile = possibleFiles[Math.floor(Math.random() * possibleFiles.length)];

        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const audioBuffer = fs.readFileSync(randomFile);
            await client.sendMessage(m.chat, {
                audio: audioBuffer,
                ptt: true,
                mimetype: 'audio/mpeg',
                fileName: 'toxic-menu.m4a',
            }, { quoted: m });
        } catch {
            await client.sendMessage(m.chat, {
                audio: { url: randomFile },
                ptt: true,
                mimetype: 'audio/mpeg',
                fileName: 'toxic-menu.m4a',
            }, { quoted: m });
        }
    },
};
