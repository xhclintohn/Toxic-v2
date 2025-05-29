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
} = require("baileys-elite");

const pino = require("pino");
const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
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
const { getSettings, getBannedUsers, banUser } = require("../Database/config%C2%A0");
const { botname } = require('../Env/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../Handler/commandHandler');
authenticationn();

const sessionDir = path.join(__dirname, '..', 'Session');

// Function to initialize or load Base64 session
async function initializeSession(base64Creds = null) {
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    // If Base64 credentials are provided (from session generator), use them
    if (base64Creds) {
        try {
            const credsBuffer = Buffer.from(base64Creds, 'base64');
            const credsPath = path.join(sessionDir, 'creds.json');
            fs.writeFileSync(credsPath, credsBuffer);
            console.log(chalk.green('Base64 session credentials loaded into Session/creds.json'));
        } catch (err) {
            console.error(chalk.red('Failed to load Base64 credentials:', err));
        }
    }
}

async function startToxic() {
    let settings = await getSettings();
    if (!settings) {
        console.error(chalk.red('Failed to load settings, exiting...'));
        return;
    }

    const { autobio, mode, anticall } = settings;

    // Load session, optionally using Base64 credentials from session generator
    // Replace 'YOUR_BASE64_CREDS' with the actual Base64 string from the session generator
    // In practice, this could be passed via environment variable or file
    const base64Creds = process.env.BASE64_CREDS || null; // Set this via environment or input
    await initializeSession(base64Creds);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const client = toxicConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        version: [2, 3000, 1015901307], // Match session generator version
        fireInitQueries: false,
        shouldSyncHistoryMessage: false,
        downloadHistory: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 30_000,
        browser: [2, 3000, 1023223821], // Updated browser version
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

        if (processedCalls.has(callId)) return;
        processedCalls.add(callId);

        await client.rejectCall(callId, callerJid);
        await client.sendMessage(callerJid, { text: "> You have been banned for calling without permission ⚠️!" });

        const bannedUsers = await getBannedUsers();
        if (!bannedUsers.includes(callerNumber)) {
            await banUser(callerNumber);
        }
    });

    client.ev.on("messages.upsert", async (chatUpdate) => {
        let settings = await getSettings();
        if (!settings) return;

        const { autoread, autolike, autoview, presence } = settings;

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
        if (autolike && remoteJid === "status@broadcast" && mek.key.id) {
            await client.sendMessage(remoteJid, {
                react: { key: mek.key, text: "😭" }
            });
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

        m = smsg(client, mek, store);
        require("./toxic")(client, m, chatUpdate, store);
    });

    // Enhanced connection handler
    client.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            console.log(chalk.green('Successfully connected to WhatsApp servers'));
        } else if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut) {
                console.log(chalk.red('Logged out, clearing session...'));
                fs.rmSync(sessionDir, { recursive: true, force: true });
                await startToxic();
            } else if (statusCode === DisconnectReason.connectionLost || statusCode === DisconnectReason.connectionClosed) {
                console.log(chalk.yellow('Connection lost, retrying in 10s...'));
                setTimeout(startToxic, 10000);
            } else if (statusCode === DisconnectReason.rateOverLimit) {
                console.log(chalk.yellow('Rate limit hit, retrying in 60s...'));
                setTimeout(startToxic, 60000);
            } else if (statusCode === DisconnectReason.badSession) {
                console.log(chalk.red('Bad session, clearing and restarting...'));
                fs.rmSync(sessionDir, { recursive: true, force: true });
                await startToxic();
            } else {
                console.error(chalk.red('Connection closed with error:', lastDisconnect?.error));
                setTimeout(startToxic, 10000);
            }
        }
    });

    client.ev.on("creds.update", saveCreds);

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
                if (!(v.name || v.subject)) v = await client.groupMetadata(id) || {};
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
        require("../Handler/eventHandler")(client, m);
        require("../Handler/eventHandler2")(client, m);
    });

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