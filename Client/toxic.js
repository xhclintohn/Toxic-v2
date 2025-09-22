const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
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
            console.error("Toxic-MD: Settings not found, cannot proceed!");
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

        // Updated group metadata handling with debug logging
        try {
            m.isGroup = m.chat.endsWith("g.us");
            console.log(`Toxic-MD: Processing message in ${m.isGroup ? 'group' : 'private'} chat: ${m.chat}`);
            m.metadata = m.isGroup ? await client.groupMetadata(m.chat).catch(e => {
                console.error("Toxic-MD: Group metadata fetch error:", e);
                return {};
            }) : {};
            const participants = m.metadata?.participants || [];
            m.isAdmin = Boolean(participants.find(p => p.admin !== null && p.jid === m.sender));
            m.isBotAdmin = Boolean(participants.find(p => p.admin !== null && p.jid === botNumber));
            console.log(`Toxic-MD: isAdmin: ${m.isAdmin}, isBotAdmin: ${m.isBotAdmin} for sender: ${m.sender}`);
        } catch (error) {
            console.error("Toxic-MD: Error fetching group metadata:", error);
            m.metadata = {};
            m.isAdmin = false;
            m.isBotAdmin = false;
        }

        const clint = (m.quoted || m);
        const quoted = (clint.mtype == 'buttonsMessage') ? clint[Object.keys(clint)[1]] : (clint.mtype == 'templateMessage') ? clint.hydratedTemplate[Object.keys(clint.hydratedTemplate)[1]] : (clint.mtype == 'product') ? clint[Object.keys(clint)[0]] : m.quoted ? m.quoted : m;

        const color = (text, color) => {
            return !color ? chalk.green(text) : chalk.keyword(color)(text);
        };
        const mime = (quoted.msg || quoted).mimetype || "";
        const qmsg = (quoted.msg || quoted);

        const DevToxic = Array.isArray(sudoUsers) ? sudoUsers : [];
        const Owner = DevToxic.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);

        const groupMetadata = m.isGroup ? m.metadata : "";
        const groupName = m.isGroup && groupMetadata ? groupMetadata.subject : "";
        const participants = m.isGroup && groupMetadata ? groupMetadata.participants : "";
        const groupAdmin = m.isGroup ? (participants.filter(p => p.admin !== null).map(p => p.jid) || []) : [];
        const isBotAdmin = m.isBotAdmin;
        const isAdmin = m.isAdmin;
        const IsGroup = m.isGroup;

        const context = {
            client, m, text, Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, participants,
            pushname, body, budy, totalCommands, args, mime, qmsg, msgToxic, botNumber, itsMe,
            packname, generateProfilePicture, groupMetadata, toxicspeed, mycode,
            fetchJson, exec, getRandom, UploadFileUgu, TelegraPh, prefix, cmd, botname, mode, gcpresence, antitag, antidelete: antideleteSetting, fetchBuffer, store, uploadtoimgur, chatUpdate,
            getGroupAdmins: () => participants.filter(p => p.admin !== null).map(p => p.jid), pict, Tag
        };

        // Debug command receipt
        if (cmd) {
            console.log(`Toxic-MD: Command received: ${resolvedCommandName} in ${m.isGroup ? 'group' : 'private'} chat from ${m.sender}`);
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Banned, huh? You're too pathetic to use my commands. Get lost! 💀` }, { quoted: m });
                return;
            }
        }

        // Relax mode check to allow group messages
        if (cmd && mode === 'private' && !itsMe && !Owner && !sudoUsers.includes(m.sender)) {
            console.log(`Toxic-MD: Private mode active, skipping non-owner/non-sudo command from ${m.sender}`);
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
            console.log(`Toxic-MD: Executed command: ${resolvedCommandName}`);
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