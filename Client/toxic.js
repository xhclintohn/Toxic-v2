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

// Fix MaxListenersExceededWarning
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

        const commandName = body && body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : null;
        const resolvedCommandName = aliases[commandName] || commandName;

        const cmd = commands[resolvedCommandName];

        const args = body.trim().split(/ +/).slice(1);
        const pushname = m.pushName || "No Name";
        const botNumber = await client.decodeJid(client.user.id);
        const itsMe = m.sender == botNumber ? true : false;
        let text = (q = args.join(" "));
        const arg = budy.trim().substring(budy.indexOf(" ") + 1);
        const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

        const getGroupAdmins = (participants) => {
            let admins = [];
            for (let i of participants) {
                i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : "";
            }
            return admins || [];
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

        const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => { }) : "";
        const groupName = m.isGroup && groupMetadata ? await groupMetadata.subject : "";
        const participants = m.isGroup && groupMetadata ? await groupMetadata.participants : "";
        const groupAdmin = m.isGroup ? await getGroupAdmins(participants) : "";
        const isBotAdmin = m.isGroup ? groupAdmin.includes(botNumber) : false;
        const isAdmin = m.isGroup ? groupAdmin.includes(m.sender) : false;
        const IsGroup = m.chat?.endsWith("@g.us");

        const context = {
            client, m, text, Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, participants,
            pushname, body, budy, totalCommands, args, mime, qmsg, msgToxic, botNumber, itsMe,
            packname, generateProfilePicture, groupMetadata, toxicspeed, mycode,
            fetchJson, exec, getRandom, UploadFileUgu, TelegraPh, prefix, cmd, botname, mode, gcpresence, antitag, antidelete: antideleteSetting, fetchBuffer, store, uploadtoimgur, chatUpdate, getGroupAdmins, pict, Tag
        };

        if (cmd) {
            const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
            if (bannedUsers.includes(senderNumber)) {
                await client.sendMessage(m.chat, { text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Banned, huh? You're too pathetic to use my commands. Get lost! 💀` }, { quoted: m });
                return;
            }
        }

        if (cmd && mode === 'private' && !itsMe && !Owner && m.sender !== sudoUsers) {
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