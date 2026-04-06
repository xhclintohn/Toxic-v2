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

        await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

        const bodyText = m.body || '';
        const cleanText = bodyText.trimStart().slice(prefix.length).trimStart();

        if (cleanText !== '' && !['menu', 'help', 'commands', 'list'].includes(cleanText.split(' ')[0].toLowerCase())) {
            const commandName = cleanText.split(' ')[0];
            await client.sendMessage(m.chat, {
            }, { quoted: m });
            return;
        }

        const settings = await getSettings();
        const effectivePrefix = settings.prefix || '.';

        const toFancyFont = (text, isUpperCase = false) => {
            const fonts = {
                A: '𝘼', B: '𝘽', C: '𝘾', D: '𝘿', E: '𝙀', F: '𝙁', G: '𝙂', H: '𝙃', I: '𝙄', J: '𝙅', K: '𝙆', L: '𝙇', M: '𝙈',
                N: '𝙉', O: '𝙊', P: '𝙋', Q: '𝙌', R: '𝙍', S: '𝙎', T: '𝙏', U: '𝙐', V: '𝙑', W: '𝙒', X: '𝙓', Y: '𝙔', Z: '𝙕',
                a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞', j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢',
                n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧', s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭', y: '𝙮', z: '𝙯',
            };
            return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
                .split('')
                .map((char) => fonts[char] || char)
                .join('');
        };


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
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: 'GitHub Repo',
                                    url: 'https://github.com/xhclintohn/Toxic-MD',
                                    merchant_url: 'https://github.com/xhclintohn/Toxic-MD',
                                }),
                            },
                            {
                                name: 'single_select',
                                buttonParamsJson: JSON.stringify({
                                    title: '𝐕𝐈𝐄𝐖☇ 𝐎𝐏𝐓𝐈𝐎𝐍𝐒 ☑',
                                    sections: [
                                        {
                                            title: '⌜ 𝘾𝙤𝙧𝙚 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 ⌟',
                                            highlight_label: '© 丨几匚',
                                            rows: [
                                                { title: '𝐅𝐮𝐥𝐥𝐌𝐞𝐧𝐮', description: 'Display all commands', id: `${prefix}fullmenu` },
                                                { title: '𝐃𝐞𝐯', description: "send developer contact", id: `${prefix}dev` },
                                            ],
                                        },
                                        {
                                            title: 'ℹ 𝙄𝙣𝙛𝙤 𝘽𝙤𝙩',
                                            highlight_label: '© 丨几匚',
                                            rows: [
                                                { title: '𝐏𝐢𝐧𝐠', description: '', id: `${prefix}ping` },
                                                { title: '𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬', description: 'show bot settings', id: `${prefix}settings` },
                                            ],
                                        },
                                        {
                                            title: '📜 𝘾𝙖𝙩𝙚𝙜𝙤𝙧𝙮 𝙈𝙚𝙣𝙪𝙨',
                                            highlight_label: '© 丨几匚',
                                            rows: [
                                                { title: '𝐆𝐞𝐧𝐞𝐫𝐚𝐥𝐌𝐞𝐧𝐮', description: 'General commands', id: `${prefix}generalmenu` },
                                                { title: '𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬𝐌𝐞𝐧𝐮', description: 'Bot settings commands', id: `${prefix}settingsmenu` },
                                                { title: '𝐎𝐰𝐧𝐞𝐫𝐌𝐞𝐧𝐮', description: 'Owner only commands', id: `${prefix}ownermenu` },
                                                { title: '𝐇𝐞𝐫𝐨𝐤𝐮𝐌𝐞𝐧𝐮', description: 'Heroku related commands', id: `${prefix}herokumenu` },
                                                { title: '𝐏𝐫𝐢𝐯𝐚𝐜𝐲𝐌𝐞𝐧𝐮', description: 'Privacy commands', id: `${prefix}privacymenu` },
                                                { title: '𝐆𝐫𝐨𝐮𝐩𝐌𝐞𝐧𝐮', description: 'Group management', id: `${prefix}groupmenu` },
                                                { title: '𝐀𝐈𝐌𝐞𝐧𝐮', description: 'AI & chat commands', id: `${prefix}aimenu` },
                                                { title: '𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐌𝐞𝐧𝐮', description: 'Media downloaders', id: `${prefix}downloadmenu` },
                                                { title: '𝐄𝐝𝐢𝐭𝐢𝐧𝐠𝐌𝐞𝐧𝐮', description: 'Media editing tools', id: `${prefix}editingmenu` },
                                                { title: '𝐋𝐨𝐠𝐨𝐌𝐞𝐧𝐮', description: 'Logo & text makers', id: `${prefix}logomenu` },
                                                { title: '+𝟏𝟖𝐌𝐞𝐧𝐮', description: 'NSFW commands (18+)', id: `${prefix}+18menu` },
                                                { title: '𝐔𝐭𝐢𝐥𝐬𝐌𝐞𝐧𝐮', description: 'Utility commands', id: `${prefix}utilsmenu` },
                                            ],
                                        },
                                    ],
                                }),
                            },
                        ],
                        messageParamsJson: JSON.stringify({
                            limited_time_offer: {
                                text: 'Toxic-MD',
                                url: 'https://github.com/xhclintohn/Toxic-MD',
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
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                            showAdAttribution: false,
                            renderLargerThumbnail: true,
                        },
                    },
                },
            },
            { quoted: m }
        );

        await client.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

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

        const possibleFiles = [];
        const menuFiles = [
            'menu1.mp3',
            'menu2.mp3',
            'menu3.mp3',
            'menu4.mp3'
        ];

        for (const fileName of menuFiles) {
            const fullPath = path.join(audioFolder, fileName);
            if (fs.existsSync(fullPath)) {
                possibleFiles.push(fullPath);
            }
        }

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
    },
};