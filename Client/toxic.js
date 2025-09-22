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
        if (!settings) {
            console.log('[ERROR] Settings not found, skipping message processing.');
            return;
        }

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

        // Use group metadata and admin status from smsg.js
        const IsGroup = m.isGroup || m.chat?.endsWith("@g.us"); // Fallback for safety
        const groupMetadata = m.metadata || {};
        const groupName = IsGroup && groupMetadata.subject ? groupMetadata.subject : "";
        const participants = groupMetadata.participants || [];

        // Debug logging for group issues
        if (body) {
            console.log(`[MESSAGE DEBUG] Chat: ${m.chat}, IsGroup: ${IsGroup}, isBotAdmin: ${m.isBotAdmin}, isAdmin: ${m.isAdmin}, Command: ${commandName || 'none'}, Resolved: ${resolvedCommandName || 'none'}, Cmd exists: ${!!cmd}, Sender: ${m.sender}, Text: ${body}`);
        }

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
            client, m, text, Owner, chatUpdate, store, isBotAdmin: m.isBotAdmin, isAdmin: m.isAdmin, IsGroup,
            participants, pushname, body, budy, totalCommands, args, mime, qmsg, msgToxic, botNumber, itsMe,
            packname, generateProfilePicture, groupMetadata, toxicspeed, mycode,
            fetchJson, exec, getRandom, UploadFileUgu, TelegraPh, prefix, cmd, botname, mode, gcpresence, antitag, antidelete: antideleteSetting, fetchBuffer, store, uploadtoimgur, chatUpdate, getGroupAdmins, pict, Tag
        };

        if (cmd) {
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, { 
                    text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Banned, huh? You're too pathetic to use my commands. Get lost! 💀\n◈━━━━━━━━━━━━━━━━◈`,
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

            if (mode === 'private' && !itsMe && !Owner && !sudoUsers.includes(m.sender)) {
                console.log(`[DEBUG] Command blocked: Private mode, sender ${m.sender} is not owner or sudo`);
                return;
            }

            console.log(`[DEBUG] Executing command: ${resolvedCommandName} in ${IsGroup ? 'group' : 'private'} chat`);
            try {
                await cmd(context);
            } catch (err) {
                console.error(`[ERROR] Command ${resolvedCommandName} failed:`, util.format(err));
                await m.reply(`◈━━━━━━━━━━━━━━━━◈\n❒ Command ${resolvedCommandName} failed! Something broke, and it’s probably not my fault! 😬\n◈━━━━━━━━━━━━━━━━◈`);
            }
        }

        if (antideleteSetting === true) {
            await antidelete(client, m, store, pict);
        }
        await antilink(client, m, store);
        await chatbotpm(client, m, store, chatbotpmSetting);
        await status_saver(client, m, Owner, prefix);
        await gcPresence(client, m);
        await antitaggc(client, m, m.isBotAdmin, itsMe, m.isAdmin, Owner, body);

        console.log(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot successfully connected to WhatsApp ✅💫\n│❒ Loaded ${totalCommands} plugins. Toxic-MD is ready to dominate! 😈\n┗━━━━━━━━━━━━━━━┛`);

    } catch (err) {
        console.error('[ERROR] Toxic-MD Error:', util.format(err));
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
        console.error('[ERROR] Toxic-MD Caught exception:', err);
    });
};