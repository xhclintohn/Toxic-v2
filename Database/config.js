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
} = require("baileys-pro");

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
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('../lib/botFunctions');
const store = makeInMemoryStore({ logger: pino().child({ level: "silent", stream: "store" }) });

const authenticationn = require('../Auth/auth.js');
const { smsg } = require('../Handler/smsg');
const { getSettings, getBannedUsers, banUser } = require("../Database/config");

const { botname } = require('../Env/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../Handler/commandHandler');

const path = require('path');

const sessionName = path.join(__dirname, '..', 'Session');

const groupEvents = require("../Handler/eventHandler");
const groupEvents2 = require("../Handler/eventHandler2");
const connectionHandler = require('../Handler/connectionHandler');

// Initialize authentication
authenticationn();

async function startToxic() {
    let settings = await getSettings();
    if (!settings) {
        console.error("Failed to load settings, exiting...");
        process.exit(1);
    }

    const { autobio, mode, anticall, autolike, reactEmoji } = settings;

    const { saveCreds, state } = await useMultiFileAuthState(sessionName);
    const client = toxicConnect({
        logger: pino({ level: "silent" }),
        printQRInTerminal: true,
        browser: ["Toxic-MD", "Chrome", "1.0.0"],
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg.message || undefined;
            }
            return { conversation: "Toxic-MD whatsapp user bot" };
        },
        version: [2, 3000, 1023223821],
        fireInitQueries: false,
        shouldSyncHistoryMessage: false,
        downloadHistory: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 30_000,
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
        const settings = await getSettings();
        if (!settings?.anticall) return;

        const callId = json.content[0].attrs['call-id'];
        const callerJid = json.content[0].attrs['call-creator'];
        const callerNumber = callerJid.replace(/[@.a-z]/g, "");

        if (processedCalls.has(callId)) return;
        processedCalls.add(callId);

        await client.rejectCall(callId, callerJid);
        await client.sendMessage(callerJid, { text: "> You Have been banned for calling without permission ⚠️!" });

        const bannedUsers = await getBannedUsers();
        if (!bannedUsers.includes(callerNumber)) {
            await banUser(callerNumber);
        }
    });

    client.ev.on("messages.upsert", async (chatUpdate) => {
        let settings = await getSettings();
        if (!settings) return;

        const { autoread, autolike, autoview, presence, reactEmoji } = settings;

        let mek = chatUpdate.messages[0];
        if (!mek || !mek.key || !mek.message) return;

        mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

        const remoteJid = mek.key.remoteJid;
        const sender = client.decodeJid(mek.key.participant || mek.key.remoteJid);
        const Myself = client.decodeJid(client.user.id);

        // Antilink logic
        if (typeof remoteJid === 'string' && remoteJid.endsWith("@g.us")) {
            const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
            const messageContent = (
                mek.message.conversation ||
                mek.message.extendedTextMessage?.text ||
                mek.message.imageMessage?.caption ||
                mek.message.videoMessage?.caption ||
                mek.message.documentMessage?.caption ||
                ""
            ).toLowerCase();

            if (sender === Myself) return;

            if (urlRegex.test(messageContent)) {
                const groupMetadata = await client.groupMetadata(remoteJid);
                if (!groupMetadata || !groupMetadata.participants) return;

                const groupAdmins = groupMetadata.participants
                    .filter(p => p.admin != null)
                    .map(p => client.decodeJid(p.id));
                const isBotAdmin = groupAdmins.includes(Myself);
                const isSenderAdmin = groupAdmins.includes(sender);

                if (isBotAdmin && !isSenderAdmin) {
                    await client.sendMessage(remoteJid, {
                        delete: {
                            remoteJid: remoteJid,
                            fromMe: false,
                            id: mek.key.id,
                            participant: sender
                        }
                    });
                }
            }
        }

        // Autolike for statuses
        if (autolike && mek.key && mek.key.remoteJid === "status@broadcast") {
            const nickk = client.decodeJid(client.user.id);
            const emojis = ['🗿', '⌚️', '💠', '👣', '🥲', '💔', '🤍', '❤️‍🔥', '💣', '🧠', '🦅', '🌻', '🧊', '🛑', '🧸', '👑', '📍', '😅', '🎭', '🎉', '😳', '💯', '🔥', '💫', '👽', '💗', '❤️‍🔥', '🥀', '👀', '🙌', '🙆', '🌟', '💧', '🦄', '🟢', '🎎', '✅', '🥱', '🌚', '💚', '💕', '😉', '😔'];
            const emoji = reactEmoji === 'random' ? emojis[Math.floor(Math.random() * emojis.length)] : reactEmoji;
            await client.sendMessage(mek.key.remoteJid, { react: { text: emoji, key: mek.key } }, { statusJidList: [mek.key.participant, nickk] });
        }

        // Autoview/autoread
        if (autoview && remoteJid === "status@broadcast") {
            await client.readMessages([mek.key]);
        } else if (autoread && remoteJid.endsWith('@s.whatsapp.net')) {
            await client.readMessages([mek.key]);
        }

        // Presence
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

        // Handle commands
        if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;

        const m = smsg(client, mek, store);
        require("./toxic")(client, m, chatUpdate, store);
    });

    const unhandledRejections = new Map();
    process.on("unhandledRejection", (reason, promise) => {
        unhandledRejections.set(promise, reason);
        console.error("Unhandled Rejection at:", promise, "reason:", reason);
    });
    process.on("rejectionHandled", (promise) => {
        unhandledRejections.delete(promise);
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

    client.ev.on("connection.update", async (update) => {
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

// Start the server and bot
app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => console.log(`Server listening on port http://localhost:${port}`));

startToxic().catch((err) => {
    console.error("Failed to start Toxic:", err);
    process.exit(1);
});

module.exports = startToxic;

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update ${__filename}`));
    delete require.cache[file];
    require(file);
});