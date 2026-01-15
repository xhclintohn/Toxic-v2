const {
  default: toxicConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
  makeCacheableSignalKeyStore,
  Browsers,
  generateWAMessageContent,
  generateWAMessageFromContent
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
const groupEvents2 = require("../Handler/eventHandler");
const connectionHandler = require('../Handler/connectionHandler');
const antidelete = require('../Functions/antidelete');
const antilink = require('../Functions/antilink');
const antistatusmention = require('../Functions/antistatusmention');

async function startToxic() {
  let settingss = await getSettings();
  if (!settingss) {
    console.log(`❌ TOXIC-MD FAILED TO CONNECT - Settings not found`);
    return;
  }

  const { autobio, mode, anticall } = settingss;
  const { version } = await fetchLatestBaileysVersion();

  const { saveCreds, state } = await useMultiFileAuthState(sessionName);

  const client = toxicConnect({
    printQRInTerminal: false,
    syncFullHistory: true,
    markOnlineOnConnect: false,
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
    browser: ["Ubuntu", "Chrome", "125"],
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
        `${botname} 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝟐𝟒/𝟕\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} 𝐈𝐭'𝐬 𝐚 ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })}.`
      );
    }, 10 * 1000);
  }

  const processedCalls = new Set();

  client.ws.on('CB:call', async (json) => {
    const settingszs = await getSettings();
    if (!settingszs?.anticall) return;

    const callId = json.content[0].attrs['call-id'];
    const callerJid = json.content[0].attrs['call-creator'];

    const isGroupCall = callerJid.endsWith('@g.us');
    if (isGroupCall) return;

    const callerNumber = callerJid.replace(/[@.a-z]/g, "");

    if (processedCalls.has(callId)) {
      return;
    }
    processedCalls.add(callId);

    const fakeQuoted = {
      key: {
        participant: '0@s.whatsapp.net',
        remoteJid: '0@s.whatsapp.net',
        id: callId
      },
      message: {
        conversation: "Verified"
      },
      contextInfo: {
        mentionedJid: [callerJid],
        forwardingScore: 999,
        isForwarded: true
      }
    };

    await client.rejectCall(callId, callerJid);
    await client.sendMessage(callerJid, {
      text: "> You Have been banned for calling without permission ⚠️!"
    }, { quoted: fakeQuoted });

    const bannedUsers = await getBannedUsers();
    if (!bannedUsers.includes(callerNumber)) {
      await banUser(callerNumber);
    }
  });

  const processedStatusMessages = new Set();

  client.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log(`📱 [DEBUG] Message received, type: ${type}`);

    let settings = await getSettings();
    if (!settings) {
      console.log(`❌ [DEBUG] Failed to get settings`);
      return;
    }

    console.log(`⚙️ [DEBUG] Settings loaded: autolike=${settings.autolike}, autolikeemoji=${settings.autolikeemoji}, autoview=${settings.autoview}`);

    const { autoread, autolike, autoview, presence, autolikeemoji } = settings;

    let mek = messages[0];
    if (!mek || !mek.key || !mek.message) {
      console.log(`❌ [DEBUG] Invalid message structure`);
      return;
    }

    mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

    const remoteJid = mek.key.remoteJid;
    const sender = client.decodeJid(mek.key.participant || mek.key.remoteJid);
    const Myself = client.decodeJid(client.user.id);

    console.log(`📍 [DEBUG] Message from: ${sender}, RemoteJid: ${remoteJid}, isStatus: ${remoteJid === "status@broadcast"}`);

    await antilink(client, mek, store);

    if (autolike && mek.key && mek.key.remoteJid === "status@broadcast") {
      console.log(`🎯 [AUTOLIKE] Status detected! Sender: ${sender}`);
      console.log(`⚙️ [AUTOLIKE] Settings check: autolike=${autolike}, emoji=${autolikeemoji}`);

      try {
        let reactEmoji = autolikeemoji || 'random';
        console.log(`🎨 [AUTOLIKE] React emoji setting: ${reactEmoji}`);

        if (reactEmoji === 'random') {
          const emojis = ['🗿', '⌚️', '💠', '👣', '🥲', '💔', '🤍', '❤️‍🔥', '💣', '🧠', '🦅', '🌻', '🧊', '🛑', '🧸', '👑', '📍', '😅', '🎭', '🎉', '😳', '💯', '🔥', '💫', '👽', '💗', '❤️‍🔥', '🥀', '👀', '🙌', '🙆', '🌟', '💧', '🦄', '🟢', '🎎', '✅', '🥱', '🌚', '💚', '💕', '😉', '😔'];
          reactEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          console.log(`🎲 [AUTOLIKE] Random emoji selected: ${reactEmoji}`);
        }

        console.log(`📤 [AUTOLIKE] Attempting to send reaction: ${reactEmoji}`);

        const nickk = await client.decodeJid(client.user.id);
        console.log(`👤 [AUTOLIKE] Bot JID: ${nickk}, Status sender: ${mek.key.participant}`);

        try {
          await client.sendMessage(mek.key.remoteJid, { 
            react: { 
              text: reactEmoji, 
              key: mek.key 
            } 
          }, { statusJidList: [mek.key.participant, nickk] });
          console.log(`✅ [AUTOLIKE] SUCCESS! Reacted to status from ${sender} with ${reactEmoji}`);
        } catch (sendError) {
          console.error(`❌ [AUTOLIKE] Failed to sendMessage:`, sendError.message);
          try {
            await client.sendMessage(mek.key.remoteJid, { 
              react: { 
                text: reactEmoji, 
                key: mek.key 
              } 
            });
            console.log(`✅ [AUTOLIKE] SUCCESS (second attempt)!`);
          } catch (error2) {
            console.error(`❌ [AUTOLIKE] Completely failed:`, error2.message);
          }
        }
      } catch (error) {
        console.error(`❌ [AUTOLIKE] Error in reaction process:`, error.message);
      }
    } else {
      console.log(`⏭️ [AUTOLIKE] Skipped - autolike=${autolike}, remoteJid=${remoteJid}, isStatus=${remoteJid === "status@broadcast"}`);
    }

    if (autoview && remoteJid === "status@broadcast") {
      console.log(`👁️ [AUTOVIEW] Status detected for viewing from ${sender}`);
      
      try {
        await client.readMessages([mek.key]);
        console.log(`✅ [AUTOVIEW] Status marked as viewed from ${sender}`);
        
        setTimeout(async () => {
          try {
            await client.readMessages([mek.key]);
          } catch (error) {}
        }, 500);
      } catch (error) {
        console.error(`❌ [AUTOVIEW] Failed to view status:`, error.message);
      }
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

    if (!client.public && !mek.key.fromMe && type === "notify") return;

    m = smsg(client, mek, store);
    require("./toxic")(client, m, { type: "notify" }, store);
  });

  client.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    if (msg.message.listResponseMessage) {
      const selectedCmd = msg.message.listResponseMessage.singleSelectReply.selectedRowId;

      const settings = await getSettings();
      const effectivePrefix = settings?.prefix || '.';

      let command = selectedCmd.startsWith(effectivePrefix)
        ? selectedCmd.slice(effectivePrefix.length).toLowerCase()
        : selectedCmd.toLowerCase();

      const m = {
        ...msg,
        body: selectedCmd,
        text: selectedCmd,
        command: command,
        prefix: effectivePrefix,
        sender: msg.key.remoteJid,
        from: msg.key.remoteJid,
        chat: msg.key.remoteJid,
        isGroup: msg.key.remoteJid.endsWith('@g.us')
      };

      try {
        require("./toxic")(client, m, { type: "notify" }, store);
      } catch (error) {
        console.error('Error processing list selection:', error);
      }
    }
  });

  client.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      if (update.key && update.key.remoteJid === "status@broadcast" && update.update.messageStubType === 1) {
        const settings = await getSettings();
        if (settings.autoview) {
          try {
            const mek = {
              key: update.key,
              message: {}
            };
            await client.readMessages([mek.key]);
          } catch (error) {}
        }
      }
    }
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error('❌ [ERROR] Unhandled Rejection:', reason.message?.substring(0, 200) || reason);
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
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
      console.log(`✅ [CONNECTION] Connected to WhatsApp successfully!`);
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

  console.log(`🚀 Toxic-MD started successfully!`);
  console.log(`📊 Current settings:`);
  console.log(`   • Autolike: ${settingss.autolike ? '✅ ON' : '❌ OFF'}`);
  console.log(`   • Autoview: ${settingss.autoview ? '✅ ON' : '❌ OFF'}`);
  console.log(`   • Autoread: ${settingss.autoread ? '✅ ON' : '❌ OFF'}`);
  console.log(`   • Reaction Emoji: ${settingss.autolikeemoji || 'random'}`);
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