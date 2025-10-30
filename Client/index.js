const {
  default: toxicConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
  makeCacheableSignalKeyStore,
  Browsers
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
const { getSettings, getBannedUsers, banUser } = require("../Database/config");

const { botname } = require('../Env/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../Handler/commandHandler');
authenticationn();

const path = require('path');
const sessionName = path.join(__dirname, '..', 'Session');

const groupEvents = require("../Handler/eventHandler");
const groupEvents2 = require("../Handler/eventHandler2");
const connectionHandler = require('../Handler/connectionHandler');
const antidelete = require('../Functions/antidelete');
const antilink = require('../Functions/antilink');

async function startToxic() {
  let settingss = await getSettings();
  if (!settingss) {
    console.log(
      `◈━━━━━━━━━━━━━━━━◈\n` +
      `│ TOXIC-MD FAILED TO CONNECT\n` +
      `│ Settings not found, check your database!\n` +
      `┗━━━━━━━━━━━━━━━┛`
    );
    return;
  }

  const { autobio, mode, anticall } = settingss;
  const { version } = await fetchLatestWaWebVersion();

  const { saveCreds, state } = await useMultiFileAuthState(sessionName);

  const client = toxicConnect({
    printQRInTerminal: false, 
    syncFullHistory: true,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000, 
    generateHighQualityLinkPreview: true, 
    patchMessageBeforeSending: (message) => { 
      const requiresPatch = !!(
        message.buttonsMessage ||
        message.templateMessage ||
        message.listMessage
      );
      if (requiresPatch) {
        message = {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...message,
            },
          },
        };
      }
      return message;
    },
    version: version,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: 'silent', stream: 'store' })),
    }
  });

  store.bind(client.ev);

  setInterval(() => {
    store.writeToFile("store.json");
  }, 3000);

  if (autobio) {
    setInterval(() => {
      const date = new Date();
      client.updateProfileStatus(
        `${botname} is active 24/7\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} It's a ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })}.`
      );
    }, 10 * 1000);
  }

  const processedCalls = new Set();

  client.ws.on('CB:call', async (json) => {
    const settingszs = await getSettings();
    if (!settingszs?.anticall) return;

    const callId = json.content[0].attrs['call-id'];
    const callerJid = json.content[0].attrs['call-creator'];
    const callerNumber = callerJid.replace(/[@.a-z]/g, "");

    if (processedCalls.has(callId)) return;
    processedCalls.add(callId);

    const fakeQuoted = {
      key: { participant: '0@s.whatsapp.net', remoteJid: '0@s.whatsapp.net', id: callId },
      message: { conversation: "Toxic Verified By WhatsApp" },
      contextInfo: { mentionedJid: [callerJid], forwardingScore: 999, isForwarded: true }
    };

    await client.rejectCall(callId, callerJid);
    await client.sendMessage(callerJid, { 
      text: "> You Have been banned for calling without permission!" 
    }, { quoted: fakeQuoted });

    const bannedUsers = await getBannedUsers();
    if (!bannedUsers.includes(callerNumber)) {
      await banUser(callerNumber);
    }
  });

  // === MAIN MESSAGE HANDLER ===
  client.ev.on("messages.upsert", async ({ messages }) => {
    let settings = await getSettings();
    if (!settings) return;

    const { autoread, autolike, autoview, presence } = settings;

    let mek = messages[0];
    if (!mek || !mek.key || !mek.message) return;

    mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

    // === FIXED FOR LID ===
    const remoteJid = mek.key.remoteJid || mek.key.lid || "";
    const sender = mek.key.participant || mek.participant || remoteJid;
    const Myself = client.decodeJid(client.user.id);

    await antidelete(client, mek, store, fs.readFileSync(path.resolve(__dirname, '../toxic.jpg')));
    await antilink(client, mek, store);

    // === STATUS REACTIONS ===
    if (autolike && mek.key && mek.key.remoteJid === "status@broadcast") {
      const nickk = client.decodeJid(client.user.id);
      const emojis = [
        '💀','⌚','💎','👣','😂','💔','🤍','❤️‍🔥','💣','🧠','🦅','🌻','❄️','🛑','🧸','👑',
        '📌','😅','🎭','🎉','😳','💯','🔥','💫','👽','💘','❤️‍🔥','🥀','👀','🙌','👌','⭐',
        '💧','🦄','🟢','🎎','✅','🥱','🌚','💚','🎀','😉','😔'
      ];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      await client.sendMessage(mek.key.remoteJid, { react: { text: randomEmoji, key: mek.key } }, { statusJidList: [mek.key.participant, nickk] });
    }

    if (autoview && remoteJid === "status@broadcast") {
      await client.readMessages([mek.key]);
    } else if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
      await client.readMessages([mek.key]);
    }

    if (remoteJid.endsWith('@s.whatsapp.net')) {
      const Chat = remoteJid;
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

    if (!client.public && !mek.key.fromMe && messages.type === "notify") return;

    m = smsg(client, mek, store);
    require("./toxic")(client, m, { type: "notify" }, store);
  });

  const unhandledRejections = new Map();
  process.on("unhandledRejection", (reason, promise) => {
    unhandledRejections.set(promise, reason);
    console.error('Unhandled Rejection:', reason);
  });
  process.on("rejectionHandled", (promise) => {
    unhandledRejections.delete(promise);
  });

  // === UPDATED decodeJid FOR LID SUPPORT ===
  client.decodeJid = (jidOrLid) => {
    if (!jidOrLid) return jidOrLid;
    try {
      if (typeof jidOrLid === "object" && jidOrLid.server) {
        return jidOrLid.user + "@" + jidOrLid.server;
      }
      if (/:\d+@/gi.test(jidOrLid)) {
        let decode = jidDecode(jidOrLid) || {};
        return (decode.user && decode.server && decode.user + "@" + decode.server) || jidOrLid;
      } else return jidOrLid;
    } catch {
      return jidOrLid;
    }
  };

  client.getName = (jid, withoutContact = false) => {
    id = client.decodeJid(jid);
    withoutContact = client.withoutContact || withoutContact;
    let v;
    if (id.endsWith("@g.us"))
      return new Promise(async (resolve) => {
        v = store.contacts[id] || {};
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {};
        resolve(v.name || v.subject || PhoneNumber("+" + id.replace("@s.whatsapp.net", "")).getNumber("international"));
      });
    else
      v = id === "0@s.whatsapp.net"
        ? { id, name: "WhatsApp" }
        : id === client.decodeJid(client.user.id)
        ? client.user
        : store.contacts[id] || {};
    return (withoutContact ? "" : v.name) || v.subject || v.verifiedName || PhoneNumber("+" + jid.replace("@s.whatsapp.net", "")).getNumber("international");
  };

  client.public = true;
  client.serializeM = (m) => smsg(client, m, store);

  client.ev.on("group-participants.update", async (m) => {
    groupEvents(client, m);
    groupEvents2(client, m);
  });

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 5000;

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    const reason = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : null;

    if (connection === "open") {
      reconnectAttempts = 0;
    }

    if (connection === "close") {
      if (reason === DisconnectReason.loggedOut || reason === 401) {
        await fs.rmSync(sessionName, { recursive: true, force: true });
        return startToxic();
      }

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
        reconnectAttempts++;
        setTimeout(() => startToxic(), delay);
      }
    }

    await connectionHandler(client, update, startToxic);
  });

  client.ev.on("creds.update", saveCreds);

  client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

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

startToxic();

module.exports = startToxic;

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});