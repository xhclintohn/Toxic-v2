import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default {
    name: 'menu',
    aliases: ['commands', 'list'],
    description: 'Displays the Toxic-MD command menu',
    run: async (context) => {
        const { client, m, mode, pict, botname, prefix } = context;
        const fq = getFakeQuoted(m);

        await client.sendMessage(m.chat, { react: { text: '🤖', key: m.key } });

        const bodyText = m.body || '';
        const cleanText = bodyText.trimStart().slice(prefix.length).trimStart();
        const firstWord = cleanText.split(' ')[0].toLowerCase();

        if (cleanText !== '' && !['menu', 'commands', 'list'].includes(firstWord)) {
            const commandName = cleanText.split(' ')[0];
            return client.sendMessage(m.chat, {
                text: `╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Yo ${m.pushName}, what's with the\n├ extra bullshit after "${commandName}"?\n├ Just type *${prefix}menu* properly, moron.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            }, { quoted: fq });
        }

        const menuText =
            `╭───(    TOXIC-MD    )───\n` +
            `├───≫ Mᴇɴᴜ ≪───\n` +
            `├ \n` +
            `Hoi  @${m.sender.split('@')[0].split(':')[0]}\n` +
            `├ \n` +
            `├ Bot: TOXIC-MD\n` +
            `├ Prefix: ${prefix}\n` +
            `├ Mode: ${mode}\n` +
            `├ \n` +
            `├ Select a button below.\n` +
            `╰──────────────────☉\n` +
            `> xD`;

        const sections = [
            {
                title: '⌜ 𝘾𝙤𝙧𝙚 𝘾𝙤𝙢𝙢𝙖𝙣𝙙𝙨 ⌟',
                highlight_label: '© 丨几匚',
                rows: [
                    { title: '𝐅𝐮𝐥𝐥𝐌𝐞𝐧𝐮', description: 'Display all commands', id: `${prefix}fullmenu` },
                    { title: '𝐃𝐞𝐯', description: "Send developer contact", id: `${prefix}dev` },
                    { title: '𝐑𝐞𝐩𝐨𝐫𝐭', description: 'Report a bug to dev', id: `${prefix}report` },
                ],
            },
            {
                title: '𝙄𝙣𝙛𝙤 𝘽𝙤𝙩',
                highlight_label: '© 丨几匚',
                rows: [
                    { title: '𝐏𝐢𝐧𝐠', description: 'Check bot speed', id: `${prefix}ping` },
                    { title: '𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬', description: 'Show bot settings', id: `${prefix}settings` },
                    { title: '𝐌𝐨𝐝𝐞', description: 'Toggle bot mode', id: `${prefix}mode` },
                ],
            },
            {
                title: '𝘾𝙖𝙩𝙚𝙜𝙤𝙧𝙮 𝙈𝙚𝙣𝙪𝙨',
                highlight_label: '© 丨几匚',
                rows: [
                    { title: '𝐆𝐞𝐧𝐞𝐫𝐚𝐥𝐌𝐞𝐧𝐮', description: 'General commands', id: `${prefix}generalmenu` },
                    { title: '𝐒𝐞𝐭𝐭𝐢𝐧𝐠𝐬𝐌𝐞𝐧𝐮', description: 'Bot settings commands', id: `${prefix}settingsmenu` },
                    { title: '𝐎𝐰𝐧𝐞𝐫𝐌𝐞𝐧𝐮', description: 'Owner only commands', id: `${prefix}ownermenu` },
                    { title: '𝐆𝐫𝐨𝐮𝐩𝐌𝐞𝐧𝐮', description: 'Group management', id: `${prefix}groupmenu` },
                    { title: '𝐀𝐈𝐌𝐞𝐧𝐮', description: 'AI & chat commands', id: `${prefix}aimenu` },
                    { title: '𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐌𝐞𝐧𝐮', description: 'Media downloaders', id: `${prefix}downloadmenu` },
                    { title: '𝐄𝐝𝐢𝐭𝐢𝐧𝐠𝐌𝐞𝐧𝐮', description: 'Media editing tools', id: `${prefix}editingmenu` },
                    { title: '𝐄𝐟𝐟𝐞𝐜𝐭𝐬𝐌𝐞𝐧𝐮', description: 'Text effect commands', id: `${prefix}effectsmenu` },
                    { title: '𝐀𝐧𝐢𝐦𝐞𝐌𝐞𝐧𝐮', description: 'Anime image commands', id: `${prefix}animemenu` },
                    { title: '𝐔𝐭𝐢𝐥𝐬𝐌𝐞𝐧𝐮', description: 'Utility commands', id: `${prefix}utilsmenu` },
                    { title: '𝐑𝐞𝐚𝐜𝐭𝐢𝐨𝐧𝐬𝐌𝐞𝐧𝐮', description: 'Reaction commands', id: `${prefix}reactionsmenu` },
                    { title: '𝐏𝐫𝐢𝐯𝐚𝐜𝐲𝐌𝐞𝐧𝐮', description: 'Privacy commands', id: `${prefix}privacymenu` },
                ],
            },
        ];

        try {
            const msg = await generateWAMessageFromContent(m.chat, proto.Message.fromObject({
                interactiveMessage: {
                    body: { text: menuText },
                    footer: { text: `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` },
                    header: { hasMediaAttachment: false },
                    contextInfo: {
                        mentionedJid: [m.sender],
                        externalAdReply: {
                            title: `${botname}`,
                            body: `Yo, ${m.pushName}! Ready to fuck shit up?`,
                            mediaType: 1,
                            thumbnail: pict,
                            mediaUrl: '',
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                            showAdAttribution: false,
                            renderLargerThumbnail: true,
                        }
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: '⭐ GitHub Repo',
                                    url: 'https://github.com/xhclintohn/Toxic-MD',
                                    merchant_url: 'https://github.com/xhclintohn/Toxic-MD'
                                })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: '📖 Full Menu', id: `${prefix}fullmenu` })
                            },
                            {
                                name: 'quick_reply',
                                buttonParamsJson: JSON.stringify({ display_text: 'Ping', id: `${prefix}ping` })
                            }
                        ],
                        messageVersion: 1,
                        messageParamsJson: JSON.stringify({
                            bottom_sheet: { in_thread_buttons_limit: 3, divider_indices: [] },
                            tap_target_configuration: { canonical_url: 'https://github.com/xhclintohn/Toxic-MD', url_type: 'STATIC', button_index: 0, tap_target_format: 1 },
                            tap_target_list: [{ canonical_url: 'https://github.com/xhclintohn/Toxic-MD', url_type: 'STATIC', button_index: 0, tap_target_format: 1 }]
                        })
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
                        body: `Yo, ${m.pushName}! Ready to fuck shit up?`,
                        mediaType: 1,
                        thumbnail: pict,
                        mediaUrl: '',
                        sourceUrl: 'https://github.com/xhclintohn/Toxic-MD',
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                    }
                }
            }, { quoted: fq });
            await client.sendMessage(m.chat, {
                listMessage: {
                    title: '𝐕𝐈𝐄𝐖☇ 𝐎𝐏𝐓𝐈𝐎𝐍𝐒 ☑',
                    description: 'Select a category to view its commands.',
                    buttonText: '📖 Browse Commands',
                    listType: 1,
                    sections: sections.map(s => ({
                        title: s.title,
                        rows: s.rows.map(r => ({ title: r.title, description: r.description, rowId: r.id }))
                    })),
                    footer: `> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
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