const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs");
const util = require("util");
const chalk = require("chalk");
const speed = require("performance-now");
const { smsg, formatp, tanggal, formatDate, getTime, sleep, clockString, fetchJson, getBuffer, jsonformat, generateProfilePicture, parseMention, getRandom, fetchBuffer } = require('../lib/botFunctions.js');
const { exec, spawn, execSync } = require("child_process");
const { TelegraPh, UploadFileUgu } = require("../lib/toUrl");
const uploadtoimgur = require('../lib/Imgur');
const { readFileSync } = require('fs');

const { commands, aliases, totalCommands } = require('../Handler/commandHandler');
const status_saver = require('../Functions/status_saver');
const gcPresence = require('../Functions/gcPresence');
const antitaggc = require('../Functions/antitag');
const antidel = require('../Functions/antidelete');

const { getSettings, getSudoUsers, getBannedUsers } = require('../Database/config');

const { botname, mycode } = require('../Env tom/settings');

module.exports = toxic = async (client, m, chatUpdate, store) => {
  try {
    const sudoUsers = await getSudoUsers();
    const bannedUsers = await getBannedUsers();

    let settings = await getSettings();
    if (!settings) {
      console.error(chalk.red("Settings not found! Toxic Multidevice is crippled! 💀"));
      return;
    }

    const { prefix, mode, gcpresence, antitag, antidelete, antilink, packname, reactEmoji } = settings;

    // Import getToxicReply from index.js
    const getToxicReply = require('../index').getToxicReply;

    const body =
      m.mtype === "conversation"
        ? m.message.conversation
        : m.mtype === "imageMessage"
          ? m.message.imageMessage.caption
          : m.mtype === "extendedTextMessage"
            ? m.message.extendedTextMessage.text
            : "";

    const Tag =
      m.mtype === "extendedTextMessage" &&
      m.message.extendedTextMessage.contextInfo?.mentionedJid
        ? m.message.extendedTextMessage.contextInfo.mentionedJid
        : [];

    const msgToxic = m.message.extendedTextMessage?.contextInfo?.quotedMessage || null;
    const budy = typeof m.text === "string" ? m.text : "";

    const timestamp = speed();
    const toxicspeed = speed() - timestamp;

    const path = require('path');
    const filePath = path.resolve(__dirname, '../toxic.jpg');
    const pict = fs.readFileSync(filePath);

    const commandName = body.startsWith(prefix) ? body.slice(prefix.length).trim().split(/\s+/)[0].toLowerCase() : null;
    const resolvedCommandName = aliases[commandName] || commandName;

    const cmd = body.startsWith(prefix) && commands[resolvedCommandName];

    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
    const itsMe = m.sender === botNumber;
    const text = args.join(" ");
    const arg = budy.trim().substring(budy.indexOf(" ") + 1);
    const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);

    const getGroupAdmins = (participants) => {
      let admins = [];
      for (let i of participants) {
        if (i.admin === "superadmin" || i.admin === "admin") {
          admins.push(i.id);
        }
      }
      return admins;
    };

    const fortu = m.quoted || m;
    const quoted = (fortu.mtype === 'buttonsMessage') ? fortu[Object.keys(fortu)[1]] :
      (fortu.mtype === 'templateMessage') ? fortu.hydratedTemplate[Object.keys(fortu.hydratedTemplate)[1]] :
      (fortu.mtype === 'product') ? fortu[Object.keys(fortu)[0]] : m.quoted || m;

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };

    const mime = (quoted.msg || quoted).mimetype || "";
    const qmsg = quoted.msg || quoted;

    const DevToxic = Array.isArray(sudoUsers) ? sudoUsers : [];
    const Owner = DevToxic.map((v) => v.replace(/[^0-9]/g, "") + "@s.whatsapp.net").includes(m.sender);

    const groupMetadata = m.isGroup ? await client.groupMetadata(m.chat).catch((e) => ({})) : {};
    const groupName = m.isGroup ? groupMetadata.subject || "" : "";
    const participants = m.isGroup ? groupMetadata.participants || [] : [];
    const groupAdmin = m.isGroup ? getGroupAdmins(participants) : [];
    const isBotAdmin = m.isGroup ? groupAdmin.includes(botNumber) : false;
    const isAdmin = m.isGroup ? groupAdmin.includes(m.sender) : false;
    const IsGroup = m.chat?.endsWith("@g.us");

    // Extended context with getToxicReply
    const context = {
      client,
      m,
      text,
      Owner,
      chatUpdate,
      store,
      isBotAdmin,
      isAdmin,
      IsGroup,
      participants,
      pushname,
      body,
      budy,
      totalCommands,
      args,
      mime,
      qmsg,
      msgToxic,
      botNumber,
      itsMe,
      packname,
      generateProfilePicture,
      groupMetadata,
      toxicspeed,
      mycode,
      fetchJson,
      exec,
      getRandom,
      UploadFileUgu,
      TelegraPh,
      prefix,
      cmd,
      botname,
      mode,
      gcpresence,
      antitag,
      antidelete,
      fetchBuffer,
      uploadtoimgur,
      getGroupAdmins,
      pict,
      Tag,
      getToxicReply // Added for commands to use
    };

    if (cmd) {
      const senderNumber = m.sender.replace(/@s\.whatsapp\.net$/, '');
      if (bannedUsers.includes(senderNumber)) {
        await client.sendText(m.chat, "❗ You’re banned, loser! No commands for you. 😈", m);
        return;
      }
    }

    if (cmd && mode === 'private' && !itsMe && !Owner && !sudoUsers.includes(m.sender)) {
      await client.sendText(m.chat, "This bot’s in private mode, punk! Only the elite can use it. 😎", m);
      return;
    }

    await antidel(client, m);
    await status_saver(client, m, Owner, prefix);
    await gcPresence(client, m);
    await antitaggc(client, m, isBotAdmin, itsMe, isAdmin, Owner, body);

    if (cmd && commands[resolvedCommandName]) {
      await commands[resolvedCommandName](context);
    }

  } catch (err) {
    console.error(chalk.red("Error in toxic.js:", util.format(err)));
  }
};

process.on('uncaughtException', function (err) {
  let e = String(err);
  if (e.includes("conflict") || e.includes("not-authorized") || e.includes("Socket connection timeout") ||
      e.includes("rate-overlimit") || e.includes("Connection Closed") || e.includes("Timed Out") ||
      e.includes("Value not found")) {
    console.warn(chalk.yellow(`Ignored error: ${e}`));
    return;
  }
  console.error(chalk.red('Caught exception:', util.format(err)));
});