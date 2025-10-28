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
const { cleanupOldMessages } = require('../lib/Store');

process.setMaxListeners(0);
cleanupOldMessages();
setInterval(() => cleanupOldMessages(), 24 * 60 * 60 * 1000);

module.exports = toxic = async (client, m, chatUpdate, store) => {
  try {
    const sudoUsers = await getSudoUsers();
    const bannedUsers = await getBannedUsers();
    let settings = await getSettings();
    if (!settings) return console.error("Settings not found!");

    const { prefix, mode, gcpresence, antitag, antidelete: antideleteSetting, antilink: antilinkSetting, chatbotpm: chatbotpmSetting, packname } = settings;

    // === EXTRACT MESSAGE BODY (INCLUDING LIST BUTTONS) ===
    var body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption ||
      m.message?.documentMessage?.caption ||
      m.message?.buttonsResponseMessage?.selectedButtonId ||
      m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||  // LIST BUTTONS
      m.text ||
      "";

    body = typeof body === 'string' ? body.trim() : '';

    const timestamp = speed();
    const toxicspeed = speed() - timestamp;
    const pict = fs.readFileSync(require('path').resolve(__dirname, '../toxic.jpg'));

    // === COMMAND DETECTION (TEXT + LIST BUTTONS) ===
    let commandName = null;

    if (body && (body.startsWith(prefix) || body.startsWith('/'))) {
      commandName = body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase();
    } 
    else if (m.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      const selectedId = m.message.listResponseMessage.singleSelectReply.selectedRowId;
      commandName = selectedId.replace(new RegExp(`^\\${prefix}`), '').trim().toLowerCase();
    }

    const resolvedCommandName = aliases[commandName] || commandName;
    const cmd = commands[resolvedCommandName];

    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
    const itsMe = m.sender == botNumber;

    // Group metadata
    try {
      m.isGroup = m.chat.endsWith("g.us");
      m.metadata = m.isGroup ? await client.groupMetadata(m.chat) : {};
      const participants = m.metadata?.participants || [];
      m.isAdmin = participants.some(p => p.admin && p.id === m.sender);
      m.isBotAdmin = participants.some(p => p.admin && p.id === botNumber);
    } catch (e) {
      m.metadata = {}; m.isAdmin = false; m.isBotAdmin = false;
    }

    const DevToxic = Array.isArray(sudoUsers) ? sudoUsers : [];
    const Owner = DevToxic.map(v => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);

    const groupMetadata = m.isGroup ? m.metadata : "";
    const groupName = m.isGroup ? groupMetadata.subject : "";
    const participants = m.isGroup ? groupMetadata.participants : [];
    const isBotAdmin = m.isBotAdmin;
    const isAdmin = m.isAdmin;
    const IsGroup = m.isGroup;

    const fakeQuoted = {
      key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: m.id },
      message: { conversation: "Toxic Verified By WhatsApp" },
      contextInfo: { mentionedJid: [m.sender], forwardingScore: 999, isForwarded: true }
    };

    const context = {
      client, m, text: args.join(" "), Owner, chatUpdate, store, isBotAdmin, isAdmin, IsGroup, participants,
      pushname, body, totalCommands, args, botNumber, itsMe, packname, generateProfilePicture,
      groupMetadata, toxicspeed, mycode, fetchJson, exec, getRandom, UploadFileUgu, TelegraPh,
      prefix, cmd, botname, mode, gcpresence, antitag, antidelete: antideleteSetting,
      fetchBuffer, store, uploadtoimgur, chatUpdate, pict,
      getGroupAdmins: () => participants.filter(p => p.admin).map(p => p.id)
    };

    // === BANNED USER CHECK ===
    if (cmd) {
      const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
      if (bannedUsers.includes(senderNumber)) {
        await client.sendMessage(m.chat, { 
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Banned, huh? You're too pathetic to use my commands. Get lost!` 
        }, { quoted: fakeQuoted });
        return;
      }
    }

    // === PRIVATE MODE CHECK ===
    if (cmd && mode === 'private' && !itsMe && !Owner && !DevToxic.includes(m.sender)) {
      return;
    }

    // === RUN FEATURES ===
    if (antideleteSetting === true) await antidelete(client, m, store, pict);
    await antilink(client, m, store);
    await chatbotpm(client, m, store, chatbotpmSetting);
    await status_saver(client, m, Owner, prefix);
    await gcPresence(client, m);
    await antitaggc(client, m, isBotAdmin, itsMe, isAdmin, Owner, body);

    // === EXECUTE COMMAND ===
    if (cmd) {
      await commands[resolvedCommandName](context);
    }

  } catch (err) {
    console.error('Toxic-MD Error:', util.format(err));
  }
};

process.on('uncaughtException', (err) => {
  if (!err.message.includes('conflict') && !err.message.includes('not-authorized') && 
      !err.message.includes('rate-overlimit') && !err.message.includes('Connection Closed')) {
    console.error('Caught exception:', err);
  }
});