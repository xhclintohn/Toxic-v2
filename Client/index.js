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

async function startDreaded() {
    let settingss = await getSettings();
    if (!settingss) {
        console.error("Failed to load settings");
        return;
    }

    const { autobio, mode, anticall } = settingss;

    const { saveCreds, state } = await useMultiFileAuthState(sessionName);
    const { version } = await fetchLatestBaileysVersion();
    const client = dreadedConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        version,
        browser: [`TOXIC`, 'Safari', '3.0'],
        fireInitQueries: false,
        shouldSyncHistoryMessage: false,
        downloadHistory: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 30_000,
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const mssg = await store.loadMessage(key.remoteJid, key.id);
                return mssg.message || undefined;
            }
            return {
                conversation: "HERE"
            };
        }
    });

    store.bind(client.ev);

    setInterval(() => { store.writeToFile("store.json"); }, 3000);

    if (autobio) {
        setInterval(() => {
            const date = new Date();
            client.updateProfileStatus(
                `${botname} 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝟐𝟒/𝟕\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} 𝐈𝐭'𝐬 𝐚 ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.`
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

        if (processedCalls.has(callId)) {
            return;
        }
        processedCalls.add(callId);

        try {
            await client.rejectCall(callId, callerJid);
            await client.sendMessage(callerJid, { text: "You will be banned for calling. Contact the owner!" });

            const bannedUsers = await getBannedUsers();
            if (!bannedUsers.includes(callerNumber)) {
                await banUser(callerNumber);
            }
        } catch (error) {
            console.error('Error handling call:', error);
        }
    });

    // Track processed message IDs to prevent duplicates
    const processedMessages = new Set();

    // Log settings once at startup
    console.log(`Settings at startup: autolike=${settingss.autolike}, autoview=${settingss.autoview}`);

    client.ev.on("messages.upsert", async (chatUpdate) => {
        let settings = await getSettings();
        if (!settings) {
            console.error("Failed to load settings");
            return;
        }

        const { autoread, autolike, autoview, presence } = settings;

        try {
            for (const msg of chatUpdate.messages) {
                if (!msg || !msg.key || !msg.message) continue;

                // Skip if already processed
                const messageId = msg.key.id;
                if (processedMessages.has(messageId)) {
                    console.log(`Skipping duplicate message: ID=${messageId}`);
                    continue;
                }
                processedMessages.add(messageId);

                // Handle ephemeral messages
                msg.message = Object.keys(msg.message)[0] === "ephemeralMessage" ? msg.message.ephemeralMessage.message : msg.message;

                const remoteJid = msg.key.remoteJid;
                const sender = client.decodeJid(msg.key.participant || msg.key.remoteJid);
                const Myself = client.decodeJid(client.user.id);

                // Antilink logic
                if (typeof remoteJid === 'string' && remoteJid.endsWith("@g.us")) {
                    try {
                        // Robust link detection
                        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
                        const messageContent = (
                            msg.message.conversation ||
                            msg.message.extendedTextMessage?.text ||
                            msg.message.imageMessage?.caption ||
                            msg.message.videoMessage?.caption ||
                            msg.message.documentMessage?.caption ||
                            msg.message.buttonsResponseMessage?.selectedButtonId ||
                            msg.message.templateButtonReplyMessage?.selectedId ||
                            ""
                        ).toLowerCase();

                        // Skip if sender is the bot or an admin
                        if (sender === Myself) continue;

                        if (urlRegex.test(messageContent)) {
                            const groupMetadata = await client.groupMetadata(remoteJid);
                            if (!groupMetadata || !groupMetadata.participants) continue;

                            const groupAdmins = groupMetadata.participants
                                .filter(p => p.admin != null)
                                .map(p => client.decodeJid(p.id));
                            const isBotAdmin = groupAdmins.includes(Myself);
                            const isSenderAdmin = groupAdmins.includes(sender);

                            if (isBotAdmin && !isSenderAdmin) {
                                // Silently delete the link message
                                await client.sendMessage(remoteJid, {
                                    delete: {
                                        remoteJid: remoteJid,
                                        fromMe: false,
                                        id: msg.key.id,
                                        participant: sender
                                    }
                                });
                            }
                        }
                    } catch (error) {
                        console.error(`[ANTILINK] Error processing link: ${error.message}`);
                    }
                }

                // Log status messages
                if (remoteJid === "status@broadcast") {
                    console.log(`Processing status: ID=${messageId}`);
                }

                // Autolike for statuses
                if (autolike && remoteJid === "status@broadcast" && messageId) {
                    console.log(`Starting auto-like for status ID=${messageId}`);
                    try {
                        // Reduced emoji set to prevent overload
                        const emojis = ['🗿', '⌚️', '💠', '👣', '🤍', '❤️‍🔥', '🔥'];
                        for (const emoji of emojis) {
                            await client.sendMessage(remoteJid, {
                                react: { key: msg.key, text: emoji }
                            });
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                        console.log(`Completed auto-like for status ID=${messageId}`);
                    } catch (error) {
                        console.error(`Auto-like failed for status ID=${messageId}: ${error.message}`);
                    }
                }

                // Autoview for statuses
                if (autoview && remoteJid === "status@broadcast") {
                    console.log(`Attempting to auto-view status ID=${messageId}`);
                    try {
                        await client.readMessages([msg.key]);
                        console.log(`Viewed status ID=${messageId}`);
                    } catch (error) {
                        console.error(`Auto-view failed for status ID=${messageId}: ${error.message}`);
                    }
                }

                // Autoread for private chats
                if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
                    try {
                        await client.readMessages([msg.key]);
                    } catch (error) {
                        console.error(`Auto-read failed for message ID=${messageId}: ${error.message}`);
                    }
                }

                // Presence
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
                    } catch (error) {
                        console.error(`Presence update failed for ${Chat}: ${error.message}`);
                    }
                }

                // Handle commands
                if (!client.public && !msg.key.fromMe && chatUpdate.type === "notify") continue;

                const m = smsg(client, msg, store);
                require("./toxic")(client, m, chatUpdate, store);

                // Delay to reduce load
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } catch (err) {
            console.error(`Error in messages.upsert: ${err.message}`);
        }

        // Clean up old message IDs to prevent memory growth
        if (processedMessages.size > 1000) {
            processedMessages.clear();
        }
    });

    // Handle error
    const unhandledRejections = new Map();
    process.on("unhandledRejection", (reason, promise) => {
        unhandledRejections.set(promise, reason);
        console.log("Unhandled Rejection at:", promise, "reason:", reason);
    });
    process.on("rejectionHandled", (promise) => {
        unhandledRejections.delete(promise);
    });
    process.on("Something went wrong", function (err) {
        console.log("Caught exception: ", err);
    });

    // Setting
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

    client.ev.on("connection.update", async (update) => {
        await connectionHandler(client, update, startDreaded);
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

    client.downloadAndSaveMediaMessage = async (message, filename, attach rattachExtension = true) => {
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