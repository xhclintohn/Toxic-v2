const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("baileys-pro");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const speed = require("performance-now");
const { smsg, formatp, tanggal, formatDate, getTime, sleep, clockString, fetchJson, getBuffer, jsonformat, generateProfilePicture, parseMention, getRandom, fetchBuffer } = require('../lib/botFunctions.js');
const { exec, spawn, execSync } = require("child_process");
const { TelegraPh, UploadFileUgu } = require("../lib/toUrl");
const uploadtoimgur = require('../lib/Imgur');

const { commands, aliases, totalCommands } = require('../Handler/commandHandler');
const status_saver = require('../Functions/status_saver');
const gcPresence = require('../Functions/gcPresence');
const antitaggc = require('../Functions/antitag');
const antidelete = require('../Functions/antidelete');
const antilink = require('../Functions/antilink');
const chatbotpm = require('../Functions/chatbotpm');

const { getSettings, getSudoUsers, getBannedUsers, getGroupSettings } = require('../Database/config');

const { botname, mycode } = require('../Env/settings');

process.setMaxListeners(0);

module.exports = toxic = async (client, m, chatUpdate, store) => {
    try {
        const sudoUsers = await getSudoUsers();
        const bannedUsers = await getBannedUsers();

        let settings = await getSettings();
        if (!settings) return;

        const { prefix, mode, gcpresence, antitag, antidelete: antideleteSetting, antilink: antilinkSetting, chatbotpm: chatbotpmSetting, packname } = settings;

        var body =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            m.message?.videoMessage?.caption ||
            m.message?.documentMessage?.caption ||
            m.message?.buttonsResponseMessage?.selectedButtonId ||
            m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
            m.text ||
            "";

        body = typeof body === 'string' ? body : '';

        const Tag =
            m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

        var msgToxic = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;

        var budy = typeof m.text == "string" ? m.text : "";

        const timestamp = speed();
        const toxicspeed = speed() - timestamp;

        const filePath = require('path').resolve(__dirname, '../toxic.jpg');
        const pict = fs.readFileSync(filePath);

        const commandName = body && (body.startsWith(prefix) || body.startsWith('/')) ? 
            body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : 
            null;
        const resolvedCommandName = aliases[commandName] || commandName;

        const cmd = commands[resolvedCommandName];

        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = m.sender == botNumber ? true : false;
        let text = (q = args.join(" "));
        const arg = budy.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

        const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch(() => ({})) : {};
        const groupName = m.isGroup && groupMetadata.subject ? groupMetadata.subject : "";
        const participants = m.isGroup && groupMetadata.participants ? groupMetadata.participants.map(p => ({
            id: p.id || null,
            jid: p.jid || null,
            admin: p.admin === 'superadmin' ? 'superadmin' : p.admin === 'admin' ? 'admin' : null,
            full: p
        })) : [];
        const groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin').map(p => p.jid || p.id);
        const isBotAdmin = m.isGroup ? groupAdmins.includes(botNumber) : false;
        const isAdmin = m.isGroup ? groupAdmins.includes(m.sender) : false;
        const IsGroup = m.chat?.endsWith("@g.us");

        const getGroupAdmins = (participants) => {
            return participants.filter(p => p.admin === 'superadmin' || p.admin === 'admin').map(p => p.jid || p.id);
        };

        const clint = (m.quoted || m);
        const quoted = (clint.mtype == 'buttonsMessage') ? clint[Object.keys(clint)[1]] : (clint.mtype == 'templateMessage') ? clint.hydratedTemplate[Object.keys(clint.hydratedTemplate)[1]] : (clint.mtype == 'product') ? clint[Object.keys(clint)[0]] : m.quoted ? m.quoted : m;

        const color = (text, color) => {
            return !color ? chalk.green(text) : chalk.keyword(color)(text);
        };
        const mime = (quoted.msg || quoted).mimetype || "";
        const qmsg = (quoted.msg || quoted);

        const DevToxic = Array.isArray(sudoUsers) ? sudoUsers : [];
        const Owner = DevToxic.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);

        const context = {
            client, m, text, Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, participants,
            pushname, body, budy, totalCommands, args, mime, qmsg, msgToxic, botNumber, itsMe,
            packname, generateProfilePicture, groupMetadata, toxicspeed, mycode,
            fetchJson, exec, getRandom, UploadFileUgu, TelegraPh, prefix, cmd, botname, mode, gcpresence, antitag, antidelete: antideleteSetting, fetchBuffer, store, uploadtoimgur, chatUpdate, getGroupAdmins, pict, Tag
        };

        if (cmd) {
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, { 
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Banned, huh? You're too pathetic to use my commands. Get lost! 💀`,
                    contextInfo: {
                        externalAdReply: {
                            title: `Toxic-MD`,
                            body: pushname,
                            previewType: "PHOTO",
                            thumbnail: pict,
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                        }
                    }
                }, { quoted: m });
                return;
            }
        }

        if (cmd && mode === 'private' && !itsMe && !Owner && m.sender !== sudoUsers) {
            return;
        }

        // Group Metadata Commands
        if (resolvedCommandName === 'setgroupname' && IsGroup) {
            if (!isAdmin) return m.reply('Only group admins can use this command! 😤');
            if (!isBotAdmin) return m.reply('I need to be an admin to change the group name, you fool! 😒');
            const newSubject = args.join(" ").trim();
            if (!newSubject) return m.reply(`Yo, give me a new group name! Usage: ${prefix}setgroupname <new name>`);
            if (newSubject.length > 100) return m.reply('Group name can’t be longer than 100 characters, genius! 😑');

            try {
                await client.groupUpdateSubject(m.chat, newSubject);
                await m.reply(`Group name slammed to "${newSubject}"! Let’s keep the chaos going! 😈`, {
                    contextInfo: {
                        externalAdReply: {
                            title: `Toxic-MD`,
                            body: `Group Update`,
                            previewType: "PHOTO",
                            thumbnail: pict,
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                        }
                    }
                });
            } catch (error) {
                console.error('Error updating group subject:', util.format(error));
                await m.reply('Failed to update group name. WhatsApp’s acting up, not me! 😬');
            }
            return;
        }

        if (resolvedCommandName === 'setgroupdesc' && IsGroup) {
            if (!isAdmin) return m.reply('Only group admins can use this command! 😤');
            if (!isBotAdmin) return m.reply('I need admin powers to change the description, bro! 😒');
            const newDesc = args.join(" ").trim();
            if (!newDesc) return m.reply(`Gimme a new description! Usage: ${prefix}setgroupdesc <new description>`);

            try {
                await client.groupUpdateDescription(m.chat, newDesc);
                await m.reply('Group description updated! Time to flex that new vibe! 🔥', {
                    contextInfo: {
                        externalAdReply: {
                            title: `Toxic-MD`,
                            body: `Group Update`,
                            previewType: "PHOTO",
                            thumbnail: pict,
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                        }
                    }
                });
            } catch (error) {
                console.error('Error updating group description:', util.format(error));
                await m.reply('Couldn’t update the description. Blame WhatsApp’s nonsense! 😬');
            }
            return;
        }

        if (resolvedCommandName === 'setgrouprestrict' && IsGroup) {
            if (!isAdmin) return m.reply('Only group admins can use this command! 😤');
            if (!isBotAdmin) return m.reply('I need to be an admin to mess with group settings, duh! 😒');
            const action = args[0]?.toLowerCase();
            if (!['on', 'off'].includes(action)) return m.reply(`Usage: ${prefix}setgrouprestrict <on|off>`);

            try {
                const restrict = action === 'on';
                await client.groupSettingUpdate(m.chat, restrict ? 'locked' : 'unlocked');
                await m.reply(`Group editing is now ${restrict ? 'locked to admins only' : 'open to all members'}! Keep it toxic! 😎`, {
                    contextInfo: {
                        externalAdReply: {
                            title: `Toxic-MD`,
                            body: `Group Update`,
                            previewType: "PHOTO",
                            thumbnail: pict,
                            sourceUrl: 'https://github.com/xhclintohn/Toxic-MD'
                        }
                    }
                });
            } catch (error) {
                console.error('Error updating group settings:', util.format(error));
                await m.reply('Failed to update group settings. WhatsApp’s tripping again! 😬');
            }
            return;
        }

        if (antideleteSetting === true) {
            await antidelete(client, m, store, pict);
        }
        await antilink(client, m, store);
        await chatbotpm(client, m, store, chatbotpmSetting);
        await status_saver(client, m, Owner, prefix);
        await gcPresence(client, m);
        await antitaggc(client, m, isBotAdmin, itsMe, isAdmin, Owner, body);

        if (cmd) {
            await commands[resolvedCommandName](context);
        }

        console.log(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot successfully connected to WhatsApp ✅💫\n│❒ Loaded ${totalCommands} plugins. Toxic-MD is ready to dominate! 😈\n┗━━━━━━━━━━━━━━━┛`);

    } catch (err) {
        console.error('Toxic-MD Error:', util.format(err));
    }

    process.on('uncaughtException', function (err) {
        let e = String(err);
        if (e.includes("conflict")) return;
        if (e.includes("not-authorized")) return;
        if (e.includes("Socket connection timeout")) return;
        if (e.includes("rate-overlimit")) return;
        if (e.includes("Connection Closed")) return;
        if (e.includes("Timed Out")) return;
        if (e.includes("Value not found")) return;
        console.error('Toxic-MD Caught exception:', err);
    });
};