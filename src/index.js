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
const express = require("express");
const app = express();
const port = process.env.PORT || 10000;
const PhoneNumber = require("awesome-phonenumber");
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('../lib/exif');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('../lib/botFunctions');
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

const authenticationn = require('../auth/auth.js');
const { smsg } = require('../handlers/smsg');
const { getSettings, getBannedUsers, banUser } = require("../database/config");

const { botname } = require('../config/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../handlers/commandHandler');
authenticationn();

const path = require('path');

const sessionName = path.join(__dirname, '..', 'Session');

const groupEvents = require("../handlers/eventHandler");
const connectionHandler = require('../handlers/connectionHandler');
const antilink = require('../features/antilink');

let cachedSettings = null;
let settingsCacheTime = 0;
const SETTINGS_CACHE_TTL = 30000;

async function getCachedSettings() {
    const now = Date.now();
    if (cachedSettings && (now - settingsCacheTime) < SETTINGS_CACHE_TTL) {
        return cachedSettings;
    }
    cachedSettings = await getSettings();
    settingsCacheTime = now;
    return cachedSettings;
}

function invalidateSettingsCache() {
    cachedSettings = null;
    settingsCacheTime = 0;
}

function cleanupSessionFiles() {
    try {
        if (!fs.existsSync(sessionName)) return;

        const files = fs.readdirSync(sessionName);
        const keepFiles = ['creds.json', 'app-state-sync-version.json', 'pre-key-', 'session-', 'sender-key-', 'app-state-sync-key-'];

        files.forEach(file => {
            const filePath = path.join(sessionName, file);
            try {
                const stats = fs.statSync(filePath);

                const shouldKeep = keepFiles.some(pattern => {
                    if (pattern.endsWith('-')) return file.startsWith(pattern);
                    return file === pattern;
                });

                if (!shouldKeep) {
                    const fileAge = Date.now() - stats.mtimeMs;
                    const hoursOld = fileAge / (1000 * 60 * 60);

                    if (hoursOld > 24) {
                        fs.unlinkSync(filePath);
                        console.log(`🗑️ Cleaned up old file: ${file}`);
                    }
                }
            } catch (fileError) {
            }
        });
    } catch (error) {
        console.error('❌ Session cleanup error:', error.message);
    }
}

let cleanupInterval = null;
let autobioInterval = null;
let storeWriteInterval = null;

async function startToxic() {
  if (cleanupInterval) clearInterval(cleanupInterval);
  cleanupInterval = setInterval(cleanupSessionFiles, 24 * 60 * 60 * 1000);
  cleanupSessionFiles();

  let settingss = await getSettings();
  if (!settingss) {
    console.log(`❌ TOXIC-MD FAILED TO CONNECT - Settings not found`);
    return;
  }

  cachedSettings = settingss;
  settingsCacheTime = Date.now();

  const { autobio, mode, anticall } = settingss;
  const { version } = await fetchLatestBaileysVersion();

  const { saveCreds, state } = await useMultiFileAuthState(sessionName);

  const client = toxicConnect({
    printQRInTerminal: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 30000,
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
    version,
    browser: ["Ubuntu", 'Chrome', "20.0.04"],
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "silent", stream: 'store' }))
    }
  });

  store.bind(client.ev);

  if (storeWriteInterval) clearInterval(storeWriteInterval);
  storeWriteInterval = setInterval(() => {
    try {
      store.writeToFile("store.json");
    } catch (e) {}
  }, 300000);

  if (autobioInterval) clearInterval(autobioInterval);
  if (autobio) {
    autobioInterval = setInterval(() => {
      try {
        const date = new Date();
        client.updateProfileStatus(
          `${botname} 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝟐𝟒/𝟕\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} 𝐈𝐭'𝐬 𝐚 ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })}.`
        );
      } catch (e) {}
    }, 60 * 1000);
  }

  const processedCalls = new Set();

  setInterval(() => {
    processedCalls.clear();
  }, 10 * 60 * 1000);

  client.ws.on('CB:call', async (json) => {
    try {
      const settingszs = await getCachedSettings();
      if (!settingszs?.anticall) return;

      const callId = json.content?.[0]?.attrs?.['call-id'];
      const callerJid = json.content?.[0]?.attrs?.['call-creator'];
      if (!callId || !callerJid) return;

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
        text: "> Calling without permission is highly prohibited ⚠️!"
      }, { quoted: fakeQuoted });

      const bannedUsers = await getBannedUsers();
      if (!bannedUsers.includes(callerNumber)) {
        await banUser(callerNumber);
      }
    } catch (callError) {
      console.error('❌ [CALL HANDLER] Error:', callError.message);
    }
  });

  client.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    let settings = await getCachedSettings();
    if (!settings) return;

    const { autoread, autolike, autoview, presence, autolikeemoji } = settings;

    for (const mek of messages) {
      if (!mek || !mek.key) continue;

      const remoteJid = mek.key.remoteJid;

      if (remoteJid === "status@broadcast") {
        if (autolike && mek.key) {
          try {
            let reactEmoji = autolikeemoji || 'random';

            if (reactEmoji === 'random') {
              const emojis = ['❤️', '👍', '🔥', '😍', '👏', '🎉', '🤩', '💯', '✨', '🌟'];
              reactEmoji = emojis[Math.floor(Math.random() * emojis.length)];
            }

            const nickk = client.decodeJid(client.user.id);

            await client.sendMessage(mek.key.remoteJid, {
              react: {
                text: reactEmoji,
                key: mek.key
              }
            }, { statusJidList: [mek.key.participant, nickk] });
          } catch (sendError) {
            try {
              let reactEmoji = autolikeemoji || '❤️';
              await client.sendMessage(mek.key.remoteJid, {
                react: {
                  text: reactEmoji,
                  key: mek.key
                }
              });
            } catch (error2) {
            }
          }
        }

        if (autoview) {
          try {
            await client.readMessages([mek.key]);
          } catch (error) {
          }
        }

        continue;
      }

      if (!mek.message) continue;

      mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

      if (!mek.message) continue;

      await antilink(client, mek, store);

      if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
        try {
          await client.readMessages([mek.key]);
        } catch (error) {}
      }

      if (remoteJid.endsWith('@s.whatsapp.net')) {
        const Chat = remoteJid;
        try {
          if (presence === 'online') {
            await client.sendPresenceUpdate("available", Chat);
          } else if (presence === 'typing') {
            await client.sendPresenceUpdate("composing", Chat);
          } else if (presence === 'recording') {
            await client.sendPresenceUpdate("recording", Chat);
          } else {
            await client.sendPresenceUpdate("unavailable", Chat);
          }
        } catch (error) {}
      }

      if (!client.public && !mek.key.fromMe) continue;

      if (mek.message?.listResponseMessage) {
        const selectedCmd = mek.message.listResponseMessage.singleSelectReply?.selectedRowId;
        if (selectedCmd) {
          const effectivePrefix = settings?.prefix || '.';
          let command = selectedCmd.startsWith(effectivePrefix)
            ? selectedCmd.slice(effectivePrefix.length).toLowerCase()
            : selectedCmd.toLowerCase();

          const listM = {
            ...mek,
            body: selectedCmd,
            text: selectedCmd,
            command: command,
            prefix: effectivePrefix,
            sender: mek.key.remoteJid,
            from: mek.key.remoteJid,
            chat: mek.key.remoteJid,
            isGroup: mek.key.remoteJid.endsWith('@g.us')
          };

          try {
            require("./toxic")(client, listM, { type: "notify" }, store);
          } catch (error) {
            console.error('❌ [LIST SELECTION] Error:', error.message);
          }
          continue;
        }
      }

      try {
        const m = smsg(client, mek, store);
        require("./toxic")(client, m, { type: "notify" }, store);
      } catch (error) {
        console.error('❌ [MESSAGE HANDLER] Error:', error.message);
      }
    }
  });

  client.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      if (update.key && update.key.remoteJid === "status@broadcast" && update.update?.messageStubType === 1) {
        const settings = await getCachedSettings();
        if (settings?.autoview) {
          try {
            await client.readMessages([update.key]);
          } catch (error) {}
        }
      }
    }
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error('❌ [UNHANDLED ERROR] Unhandled Rejection:', reason?.message?.substring(0, 200) || reason);
  });

  process.on("uncaughtException", (error) => {
    console.error('❌ [UNCAUGHT ERROR]:', error?.message?.substring(0, 200) || error);
  });

  client.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      let decode = jidDecode(jid) || {};
      return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
    } else return jid;
  };

  client.getName = (jid, withoutContact = false) => {
    const id = client.decodeJid(jid);
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
    try {
      groupEvents(client, m);
    } catch (error) {
      console.error('❌ [GROUP EVENT] Error:', error.message);
    }
  });

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 10;
  const baseReconnectDelay = 3000;

  client.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    const reason = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : null;

    if (connection === "open") {
      reconnectAttempts = 0;
      console.log(`✅ [CONNECTION] Connected to WhatsApp successfully!`);
    }

    if (connection === "close") {
      if (reason === DisconnectReason.loggedOut || reason === 401) {
        try {
          fs.rmSync(sessionName, { recursive: true, force: true });
        } catch (e) {}
        invalidateSettingsCache();
        return startToxic();
      }

      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 60000);
        reconnectAttempts++;
        console.log(`⏳ Reconnecting in ${delay/1000}s (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);
        setTimeout(() => startToxic(), delay);
        return;
      } else {
        console.log(`❌ Max reconnection attempts reached. Restarting in 60s...`);
        reconnectAttempts = 0;
        setTimeout(() => startToxic(), 60000);
        return;
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

  const totalCmds = totalCommands || 0;
  const mem = process.memoryUsage();
  const usedMB = (mem.rss / 1024 / 1024).toFixed(2);
  const platform = process.env.DYNO ? 'Heroku' : process.env.REPLIT_DEPLOYMENT ? 'Replit' : process.platform;

  console.log(chalk.green(`\n╔══════════════════════════════════════╗`));
  console.log(chalk.green(`║`) + chalk.bold.cyan(`     TOXIC-MD v2 - CONNECTED`) + chalk.green(`         ║`));
  console.log(chalk.green(`╠══════════════════════════════════════╣`));
  console.log(chalk.green(`║`) + chalk.white(` Bot Name    : ${(botname || 'Toxic-MD').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Prefix      : ${(settingss.prefix || '.').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Mode        : ${(settingss.mode || 'public').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Platform    : ${String(platform).padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` NodeJS      : ${process.version.padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Memory      : ${(usedMB + ' MB').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Commands    : ${String(totalCmds).padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`╠══════════════════════════════════════╣`));
  console.log(chalk.green(`║`) + chalk.bold.yellow(`  FEATURE STATUS`) + chalk.green(`                      ║`));
  console.log(chalk.green(`╠══════════════════════════════════════╣`));
  console.log(chalk.green(`║`) + chalk.white(` Anticall    : ${settingss.anticall ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Autobio     : ${settingss.autobio ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Autolike    : ${settingss.autolike ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Autoview    : ${settingss.autoview ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Autoread    : ${settingss.autoread ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` ChatbotPM   : ${settingss.chatbotpm ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Antidelete  : ${settingss.antidelete ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Antiedit    : ${settingss.antiedit ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Antilink    : ${(settingss.antilink || 'off').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Presence    : ${(settingss.presence || 'online').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` React Emoji : ${(settingss.autolikeemoji || 'random').padEnd(21)}`) + chalk.green(`║`));
  console.log(chalk.green(`║`) + chalk.white(` Start Msg   : ${settingss.startmessage ? '✅ ON ' : '❌ OFF'} `.padEnd(22)) + chalk.green(`║`));
  console.log(chalk.green(`╠══════════════════════════════════════╣`));
  console.log(chalk.green(`║`) + chalk.gray(`  Powered by xh_clinton`) + chalk.green(`               ║`));
  console.log(chalk.green(`╚══════════════════════════════════════╝\n`));
}

app.use(express.static('public'));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

startToxic();

module.exports = { startToxic, invalidateSettingsCache };

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});
