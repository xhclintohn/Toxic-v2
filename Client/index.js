const {
  default: dreadedConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const FileType = require("file-type");
const { exec, spawn, execSync } = require("child_process");
const axios = require("axios");
const chalk = require("chalk");
const figlet = require("figlet");
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;
const _ = require("lodash");
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('../lib/exif');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('../lib/botFunctions');
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

const authenticationn = require('../Auth/auth.js');
const { smsg } = require('../Handler/smsg');
const { getSettings, getBannedUsers, banUser, getGroupSetting } = require("../Database/config");

const { botname } = require('../Env/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../Handler/commandHandler');
authenticationn();

const path = require('path');
const sessionName = path.join(__dirname, '..', 'Session');

const groupEvents = require("../Handler/eventHandler");
const groupEvents2 = require("../Handler/eventHandler2");
const connectionHandler = require('../Handler/connectionHandler');

// Utility for toxic, styled replies
const toxicReplies = [
  "Yo, you thought you could outsmart *Toxic Multidevice*? Think again, scrub! 😈",
  "Bow to the chaos king, peasant! 💀 *Toxic Multidevice* runs this!",
  "Weak vibes detected! Step up or get wrecked! 🔥",
  "Messing with *Toxic Multidevice*? Big mistake, fam! 😎",
  "This chat belongs to *Toxic Multidevice*! Know your place! 🖤",
  "You’re out here testing me? *Toxic Multidevice* don’t play! 😈",
  "What’s this trash energy? Get smoked, loser! 💨",
  "Step into my domain and get humbled, fool! 😈💀"
];

const getToxicReply = (text) => {
  const randomToxic = toxicReplies[Math.floor(Math.random() * toxicReplies.length)];
  return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${randomToxic}\n│❒ ${text}\n◈━━━━━━━━━━━━━━━━◈`;
};

async function startDreaded() {
  let settingss = await getSettings();
  if (!settingss) {
    console.error(chalk.redBright("Failed to load settings! Using defaults... 💀"));
    settingss = { autobio: false, mode: 'public', anticall: false, autoread: false, autolike: false, autoview: false, presence: 'unavailable', reactEmoji: '😈' };
  }

  const { autobio, mode, anticall } = settingss;

  const { saveCreds, state } = await useMultiFileAuthState(sessionName);
  const client = dreadedConnect({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    version: [2, 3000, 1015901307],
    browser: [`Toxic Multidevice`, 'Safari', '3.0'],
    fireInitQueries: false,
    shouldSyncHistoryMessage: false,
    downloadHistory: false,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    keepAliveIntervalMs: 60_000,
    auth: state,
    maxRetries: 5,
    connectTimeoutMs: 30_000,
    getMessage: async (key) => {
      if (store) {
        const mssg = await store.loadMessage(key.remoteJid, key.id);
        return mssg?.message || undefined;
      }
      return { conversation: "Toxic Multidevice was here 😈" };
    }
  });

  client.reconnectAttempts = 0;
  store.bind(client.ev);

  setInterval(() => {
    try {
      store.writeToFile("store.json");
    } catch (err) {
      console.error(chalk.red("Failed to write store.json:", err));
    }
  }, 3000);

  // Auto-bio with toxic flair
  if (autobio) {
    setInterval(async () => {
      try {
        const date = new Date();
        const status = getToxicReply(
          `${botname || "Toxic Multidevice"} runs this game 24/7! 😈\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} - It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}. Bow down! 💀`
        );
        await client.updateProfileStatus(status);
        console.log(chalk.green("Auto-bio updated successfully! 😈"));
      } catch (err) {
        console.error(chalk.red("Failed to update auto-bio:", err));
      }
    }, 10 * 1000);
  }

  // Enhanced anti-call system
  const processedCalls = new Set();
  client.ws.on('CB:call', async (json) => {
    const settingszs = await getSettings() || {};
    if (!settingszs?.anticall) return;

    const callId = json.content[0].attrs['call-id'];
    const callerJid = json.content[0].attrs['call-creator'];
    const callerNumber = callerJid.replace(/[@.a-z]/g, "");

    if (processedCalls.has(callId)) return;
    processedCalls.add(callId);

    try {
      await client.rejectCall(callId, callerJid);
      await client.sendText(callerJid, "Calling *Toxic Multidevice*? You’re done, fool! Banned! 😈 Contact the owner if you got the guts. 💀", null);
      const bannedUsers = await getBannedUsers();
      if (!bannedUsers.includes(callerNumber)) {
        await banUser(callerNumber);
      }
    } catch (error) {
      console.error(chalk.red('Error handling call:', error));
    }
  });

  // Message handling with toxic responses
  client.ev.on("messages.upsert", async (chatUpdate) => {
    let settings = await getSettings() || {};
    const { autoread, autolike, autoview, presence, reactEmoji } = settings;

    try {
      let mek = chatUpdate.messages[0];
      if (!mek || !mek.message) return;

      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      const messageContent = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
      const isGroup = mek.key.remoteJid.endsWith("@g.us");
      const sender = mek.key.participant || mek.key.remoteJid;
      const Myself = await client.decodeJid(client.user.id);

      if (isGroup) {
        const antilink = await getGroupSetting(mek.key.remoteJid, "antilink");
        if ((antilink === true || antilink === 'true') && messageContent.includes("https") && sender !== Myself) {
          const groupMetadata = await client.groupMetadata(mek.key.remoteJid);
          const groupAdmins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
          const isAdmin = groupAdmins.includes(sender);
          const isBotAdmin = groupAdmins.includes(Myself);

          if (!isBotAdmin) return;
          if (!isAdmin) {
            await client.sendText(mek.key.remoteJid, `🚫 @${sender.split("@")[0]}, links? You’re outta here, clown! 😈`, mek, { contextInfo: { mentionedJid: [sender] } });
            await client.groupParticipantsUpdate(mek.key.remoteJid, [sender], "remove");
            await client.sendMessage(mek.key.remoteJid, {
              delete: {
                remoteJid: mek.key.remoteJid,
                fromMe: false,
                id: mek.key.id,
                participant: sender
              }
            });
          }
          return;
        }
      }

      // Auto-like statuses
      if (autolike && mek.key.remoteJid === "status@broadcast") {
        try {
          const emoji = reactEmoji || "😈";
          console.log(chalk.cyan(`Status detected: from=${mek.key.participant || mek.key.remoteJid}, reactEmoji=${emoji}`));
          await client.sendMessage(mek.key.remoteJid, {
            reaction: { text: emoji, key: mek.key }
          });
          console.log(chalk.green(`Auto-liked status from ${mek.key.participant || mek.key.remoteJid} with ${emoji} 😈`));
        } catch (err) {
          console.error(chalk.red(`Failed to auto-like status:`, err));
        }
      }

      // Auto-view/autoread
      if (autoview && mek.key.remoteJid === "status@broadcast") {
        await client.readMessages([mek.key]);
      } else if (autoread && mek.key.remoteJid.endsWith('@s.whatsapp.net')) {
        await client.readMessages([mek.key]);
      }

      // Presence
      if (mek.key.remoteJid.endsWith('@s.whatsapp.net')) {
        const Chat = mek.key.remoteJid;
        if (presence === 'online') {
          await client.sendPresenceUpdate("available", Chat);
        } else if (presence === 'typing') {
          await client.sendPresenceUpdate("composing", Chat);
        } else if (presence === 'recording') {
          await client.sendPresenceUpdate("recording", Chat);
        } else {
          await client.sendPresenceUpdate("unavailable", Chat);
        }
      }

      // Handle commands
      if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;

      m = smsg(client, mek, store);
      require("./toxic")(client, m, chatUpdate, store);
    } catch (err) {
      console.error(chalk.red("Error in messages.upsert:", err));
    }
  });

  // Enhanced connection handling
  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(chalk.redBright("Logged out! Restarting Toxic Multidevice... 😈"));
        startDreaded();
      } else if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost) {
        const backoff = Math.min(60_000, 1000 * Math.pow(2, client.reconnectAttempts || 0));
        console.log(chalk.yellow(`Connection lost! Reconnecting in ${backoff / 1000}s... 💀`));
        setTimeout(() => {
          client.reconnectAttempts = (client.reconnectAttempts || 0) + 1;
          startDreaded();
        }, backoff);
      } else if (reason === DisconnectReason.badSession || reason === DisconnectReason.restartRequired) {
        console.log(chalk.redBright("Bad session or restart required! Rebooting... 😈"));
        startDreaded();
      } else {
        console.log(chalk.redBright(`Unknown disconnect reason: ${reason}. Retrying... 💀`));
        setTimeout(startDreaded, 5000);
      }
    } else if (connection === "open") {
      console.log(chalk.greenBright("Toxic Multidevice is LIVE! Time to dominate! 😈💀"));
      client.reconnectAttempts = 0;
    }
  });

  // WebSocket close handler
  client.ws.on('close', () => {
    console.log(chalk.redBright("WebSocket closed! Kicking off reconnection... 😈"));
    setTimeout(startDreaded, 5000);
  });

  // Error handling
  const unhandledRejections = new Map();
  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.log(chalk.red("Unhandled Rejection at:", promise, "reason:", reason));
  });
  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });
  process.on("Something went wrong", function (err) {
    console.log(chalk.red("Caught exception:", err));
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.getName = (jid, withoutContact = false) => {
    let id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = await client.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v =
        id === "0@s.whatsapp.net"
          ? { id, name: "WhatsApp" }
          : id === client.decodeJid(client.user.id)
          ? client.user
          : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  client.public = true;
  client.serializeM = (m) => smsg(client, m, store);

  client.ev.on("group-participants.update", async (m) => {
    groupEvents(client, m);
    groupEvents2(client, m);
  });

  client.ev.on("creds.update", saveCreds);

  client.sendText = (jid, text, quoted = "", options) => {
    return client.sendMessage(jid, { text: getToxicReply(text) }, { quoted, ...options });
  };

  client.downloadMediaMessage = async (message) => {
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(message, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
    let quoted = message.msg ? message.msg : message;
    let mime = (message.msg || message).mimetype || '';
    let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
    const stream = await downloadContentFromMessage(quoted, messageType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    let type = await FileType.fromBuffer(buffer);
    const trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
    await fs.writeFileSync(trueFileName, buffer);
    return trueFileName;
  };
}

app.use(express.static('public'));

app.get("/", (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

startDreaded();

module.exports = startDreaded;

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});