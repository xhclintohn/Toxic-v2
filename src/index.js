const {
  default: toxicConnect,
  useMultiFileAuthState,
  DisconnectReason,
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

const path = require('path');

const sessionName = path.join(__dirname, '..', 'Session');

const groupEvents = require("../handlers/eventHandler");
const connectionHandler = require('../handlers/connectionHandler');

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
                    }
                }
            } catch (fileError) {
                console.error(fileError);
            }
        });
    } catch (error) {
        console.error('❌ Session cleanup error:', error);
    }
}

let cleanupInterval = null;
let autobioInterval = null;
let storeWriteInterval = null;
let memoryCheckInterval = null;
let processedCallsInterval = null;
if (global._toxicCurrentClient  === undefined) global._toxicCurrentClient  = null;
if (global._toxicIsStarting     === undefined) global._toxicIsStarting     = false;
if (global._toxicReconnectTimer === undefined) global._toxicReconnectTimer = null;
if (global._toxicShuttingDown   === undefined) global._toxicShuttingDown   = false;

async function startToxic() {
  if (global._toxicIsStarting) return;
  global._toxicIsStarting = true;

  try {
    await authenticationn();

    if (global._toxicReconnectTimer) {
      clearTimeout(global._toxicReconnectTimer);
      global._toxicReconnectTimer = null;
    }

    if (cleanupInterval) clearInterval(cleanupInterval);
    if (memoryCheckInterval) clearInterval(memoryCheckInterval);
    if (autobioInterval) clearInterval(autobioInterval);
    if (storeWriteInterval) clearInterval(storeWriteInterval);
    if (processedCallsInterval) clearInterval(processedCallsInterval);

    cleanupInterval = setInterval(cleanupSessionFiles, 24 * 60 * 60 * 1000);
    cleanupSessionFiles();

    memoryCheckInterval = setInterval(() => {
      try {
        const mem = process.memoryUsage();
        const usedMB = Math.round(mem.rss / 1024 / 1024);
        if (usedMB > 450) {
          console.log(`⚠️ High memory usage: ${usedMB}MB - running garbage collection`);
          if (global.gc) global.gc();
        }
      } catch (e) {
        console.error(e);
      }
    }, 5 * 60 * 1000);

    if (global._toxicCurrentClient) {
      try {
        global._toxicShuttingDown = true;
        global._toxicCurrentClient.ev.removeAllListeners();
        global._toxicCurrentClient.ws.removeAllListeners();
        try {
          global._toxicCurrentClient.end(new Error("Restarting client"));
        } catch (e) {
          console.error(e);
        }
        try {
          global._toxicCurrentClient.ws.close();
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        console.error(e);
      } finally {
        global._toxicCurrentClient = null;
        global._toxicShuttingDown = false;
      }
    }

    let settingss = await getSettings();
    if (!settingss) {
      console.log(`❌ TOXIC-MD FAILED TO CONNECT - Settings not found`);
      global._toxicIsStarting = false;
      return;
    }

    cachedSettings = settingss;
    settingsCacheTime = Date.now();

    const { autobio, mode, anticall } = settingss;
    const version = (await (await fetch('https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json')).json()).version;

    const { saveCreds, state } = await useMultiFileAuthState(sessionName);

    const client = toxicConnect({
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: !(settingss.presence === 'offline' || settingss.presence === 'unavailable'),
      connectTimeoutMs: 120000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      generateHighQualityLinkPreview: true,
      emitOwnEvents: true,
      fireInitQueries: true,
      retryRequestDelayMs: 10000,
      getMessage: async (key) => {
          const msg = store.loadMessage(key.remoteJid, key.id);
          return msg?.message || undefined;
      },
      transactionOpts: {
        maxCommitRetries: 10,
        delayBetweenTriesMs: 3000
      },
      patchMessageBeforeSending: (message) => {
        try {
          if (!message || typeof message !== 'object') return message;

          const hasLegacyInteractive =
            !!message.buttonsMessage ||
            !!message.templateMessage ||
            !!message.listMessage;

          if (!hasLegacyInteractive) return message;
          if (message.viewOnceMessage || message.ephemeralMessage) return message;

          return {
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
        } catch (error) {
          console.error('❌ [PATCH MESSAGE ERROR]:', error);
          return message;
        }
      },
      version,
      browser: Browsers.macOS("Chrome"),
      logger: pino({ level: 'silent' }),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino().child({ level: "silent", stream: 'store' }))
      }
    });

    global._toxicCurrentClient = client;
    store.bind(client.ev);

    storeWriteInterval = setInterval(() => {
      try {
        store.writeToFile("store.json");
      } catch (e) {
        console.error(e);
      }
    }, 300000);

    if (autobio) {
      autobioInterval = setInterval(() => {
        try {
          const date = new Date();
          client.updateProfileStatus(
            `${botname} 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝟐𝟒/𝟕\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} 𝐈𝐭'𝐬 𝐚 ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })}.`
          );
        } catch (e) {
          console.error(e);
        }
      }, 60 * 1000);
    }

    const processedCalls = new Set();

    processedCallsInterval = setInterval(() => {
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
        console.error('❌ [CALL HANDLER] Error:', callError);
      }
    });

    client.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      let settings = await getCachedSettings();
      if (!settings) return;

      const { autoread, autolike, autoview, presence, autolikeemoji, stealth } = settings;
      const isStealthOn = stealth === 'true' || stealth === true;

      for (const mek of messages) {
        try {
          if (!mek || !mek.key) continue;

          const remoteJid = mek.key.remoteJid;

          if (remoteJid === "status@broadcast") {
            if (autolike && mek.key) {
              try {
                let reactEmoji = autolikeemoji || 'random';

                if (reactEmoji === 'random') {
                  const emojis = ['❤️', '🩶', '🔥', '🤍', '♦️', '🎉', '💚', '💯', '✨', '☢️'];
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
                console.error(sendError);
                try {
                  let reactEmoji = autolikeemoji || '❤️';
                  await client.sendMessage(mek.key.remoteJid, {
                    react: {
                      text: reactEmoji,
                      key: mek.key
                    }
                  });
                } catch (error2) {
                  console.error(error2);
                }
              }
            }

            if (autoview) {
              try {
                await client.readMessages([mek.key]);
              } catch (error) {
                console.error(error);
              }
            }

            continue;
          }

          if (!mek.message) continue;

          mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

          if (!mek.message) continue;

          if (isStealthOn) {
            continue;
          }

          if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
            try {
              await client.readMessages([mek.key]);
            } catch (error) {
              console.error(error);
            }
          }

          if (remoteJid.endsWith('@s.whatsapp.net')) {
            const Chat = remoteJid;
            try {
              if (presence === 'offline' || presence === 'unavailable') {
              } else if (presence === 'online') {
                await client.sendPresenceUpdate("available", Chat);
              } else if (presence === 'typing') {
                await client.sendPresenceUpdate("composing", Chat);
              } else if (presence === 'recording') {
                await client.sendPresenceUpdate("recording", Chat);
              }
            } catch (error) {
              console.error(error);
            }
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
                console.error('❌ [LIST SELECTION] Error:', error);
              }
              continue;
            }
          }

          try {
            const m = smsg(client, mek, store);
            require("./toxic")(client, m, { type: "notify" }, store);
          } catch (error) {
            console.error('❌ [MESSAGE HANDLER] Error:', error);
          }
        } catch (loopError) {
          console.error('❌ [MESSAGE LOOP] Error:', loopError);
        }
      }
    });

    client.ev.on("messages.update", async (updates) => {
      for (const update of updates) {
        try {
          if (update.key && update.key.remoteJid === "status@broadcast" && update.update?.messageStubType === 1) {
            const settings = await getCachedSettings();
            if (settings?.autoview) {
              try {
                await client.readMessages([update.key]);
              } catch (error) {
                console.error(error);
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error('❌ [UNHANDLED ERROR] Unhandled Rejection:', reason);
    });

    process.on("uncaughtException", (error) => {
      console.error('❌ [UNCAUGHT ERROR]:', error);
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
        groupEvents(client, m, null);
      } catch (error) {
        console.error('❌ [GROUP EVENT] Error:', error);
      }
    });

    let reconnectAttempts = 0;
    const maxReconnectAttempts = 15;
    const baseReconnectDelay = 2000;

    client.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      const reason = lastDisconnect?.error ? new Boom(lastDisconnect.error).output.statusCode : null;

      if (connection === "open") {
        reconnectAttempts = 0;

        try { require("./toxic").prewarmCache(); } catch (e) {}

        console.log(chalk.green(`\n╭───(    `) + chalk.bold.cyan(`𝐓𝐨𝐱𝐢𝐜-𝐌D`) + chalk.green(`    )───`));
        console.log(chalk.green(`> ───≫ `) + chalk.yellow(`🚀 Started Successfully`) + chalk.green(`<<───`));
        console.log(chalk.green(`> `) + chalk.white(`\`々\` 𝐒𝐭𝐚𝐭𝐮𝐬 : `) + chalk.green(`Started Successfully`));
        console.log(chalk.green(`> `) + chalk.white(`\`々\` 𝐌𝐨𝐝𝐞 : `) + chalk.cyan(`${settingss.mode || 'public'}`));
        console.log(chalk.green(`╰──────────────────☉\n`));
      }

      if (connection === "close") {
        if (global._toxicShuttingDown) return;

        global._toxicCurrentClient = null;

        if (reason === DisconnectReason.loggedOut || reason === 401) {
          try {
            fs.rmSync(sessionName, { recursive: true, force: true });
          } catch (e) {
            console.error(e);
          }
          invalidateSettingsCache();
          if (!global._toxicReconnectTimer) {
            global._toxicReconnectTimer = setTimeout(() => {
              global._toxicReconnectTimer = null;
              startToxic();
            }, 2000);
          }
          return;
        }

        if (reason === DisconnectReason.connectionClosed || reason === DisconnectReason.connectionLost || reason === DisconnectReason.timedOut || reason === 408 || reason === 503 || reason === 500) {
          const delay = Math.min(baseReconnectDelay * Math.pow(1.5, reconnectAttempts), 30000);
          reconnectAttempts++;
          if (!global._toxicReconnectTimer) {
            global._toxicReconnectTimer = setTimeout(() => {
              global._toxicReconnectTimer = null;
              startToxic();
            }, delay);
          }
          return;
        }

        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttempts), 60000);
          reconnectAttempts++;
          if (!global._toxicReconnectTimer) {
            global._toxicReconnectTimer = setTimeout(() => {
              global._toxicReconnectTimer = null;
              startToxic();
            }, delay);
          }
          return;
        } else {
          reconnectAttempts = 0;
          if (!global._toxicReconnectTimer) {
            global._toxicReconnectTimer = setTimeout(() => {
              global._toxicReconnectTimer = null;
              startToxic();
            }, 30000);
          }
          return;
        }
      }

      try {
        await connectionHandler(client, update, startToxic);
      } catch (error) {
        console.error('❌ [CONNECTION HANDLER] Error:', error);
      }
    });

    client.ev.on("creds.update", saveCreds);

    const CHANNEL_JID = '120363322461279856@newsletter';
    const CHANNEL_EMOJIS = ['❤️', '🔥', '👍🏻', '✨', '🌚', '🗿', '😮'];

    client.ev.on('messages.upsert', async ({ messages: newsletterMessages }) => {
      try {
        const message = newsletterMessages[0];
        if (!message?.key) return;
        const jid = message.key.remoteJid;
        if (jid !== CHANNEL_JID) return;
        const messageId = message.newsletterServerId || message.key.id;
        if (!messageId || !client?.user?.id) return;
        const emoji = CHANNEL_EMOJIS[Math.floor(Math.random() * CHANNEL_EMOJIS.length)];
        await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 7000)));
        try {
          if (typeof client.newsletterReactMessage === 'function') {
            await client.newsletterReactMessage(jid, messageId.toString(), emoji).catch((e) => console.error(e));
          } else {
            await client.sendMessage(jid, { react: { text: emoji, key: message.key } }).catch((e) => console.error(e));
          }
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        console.error(e);
      }
    });

    client.sendText = (jid, text, quoted = "", options) => client.sendMessage(jid, { text: text, ...options }, { quoted });

    client.downloadMediaMessage = async (message) => {
      let mime = (message.msg || message).mimetype || '';
      let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
      const validTypes = ['image', 'video', 'audio', 'sticker', 'document', 'ptv'];
      if (!validTypes.includes(messageType)) {
        if (mime.startsWith('application/') || mime.startsWith('text/')) {
          messageType = 'document';
        } else if (mime.startsWith('image/')) {
          messageType = 'image';
        } else if (mime.startsWith('video/')) {
          messageType = 'video';
        } else if (mime.startsWith('audio/')) {
          messageType = 'audio';
        } else {
          messageType = 'document';
        }
      }
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
      const validSaveTypes = ['image', 'video', 'audio', 'sticker', 'document', 'ptv'];
      if (!validSaveTypes.includes(messageType)) {
        if (mime.startsWith('application/') || mime.startsWith('text/')) messageType = 'document';
        else if (mime.startsWith('image/')) messageType = 'image';
        else if (mime.startsWith('video/')) messageType = 'video';
        else if (mime.startsWith('audio/')) messageType = 'audio';
        else messageType = 'document';
      }
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

    global._toxicIsStarting = false;
  } catch (error) {
    console.error('❌ [START TOXIC ERROR]:', error);
    global._toxicCurrentClient = null;
    global._toxicIsStarting = false;
    if (!global._toxicReconnectTimer) {
      global._toxicReconnectTimer = setTimeout(() => {
        global._toxicReconnectTimer = null;
        startToxic();
      }, 5000);
    }
  }
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
  console.log(chalk.redBright(`Update ${__filename} — restarting cleanly...`));
  process.exit(0);
});