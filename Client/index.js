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
const { getSettings, getBannedUsers, banUser, getSudoUsers, addSudoUser } = require("../Database/config");
const { botname } = require('../Env/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../Handler/commandHandler');
const connectionHandler = require('../Handler/connectionHandler');
authenticationn();

const sessionDir = path.join(__dirname, '..', 'Session');

// Function to initialize or load Base64 session
async function initializeSession(base64Creds = null) {
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

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

// Function to clear session
async function clearSession() {
    try {
        if (fs.existsSync(sessionDir)) {
            fs.rmSync(sessionDir, { recursive: true, force: true });
            console.log(chalk.yellow('Cleared corrupted session. Please provide new Base64 credentials or scan QR code.'));
        }
    } catch (err) {
        console.error(chalk.red('Failed to clear session:', err));
    }
}

async function startToxic() {
    let settings = await getSettings();
    if (!settings) {
        console.error(chalk.red('Failed to load settings, exiting...'));
        return;
    }

    const { autobio, mode, anticall } = settings;

    const base64Creds = process.env.BASE64_CREDS || null;
    await initializeSession(base64Creds);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    const client = toxicConnect({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        version: [2, 3000, 1023223821],
        fireInitQueries: false,
        shouldSyncHistoryMessage: false,
        downloadHistory: false,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        keepAliveIntervalMs: 30_000,
        browser: ['DREADED', 'Safari', '3.0'],
        auth: state,
        getMessage: async (key) => {
            if (store) {
                const mssg = await store.loadMessage(key.remoteJid, key.id);
                return mssg.message || undefined;
            }
            return { conversation: "HERE" };
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

        try {
            await client.rejectCall(callId, callerJid);
            await client.sendMessage(callerJid, { text: "> You have been banned for calling without permission ⚠️!" });

            const bannedUsers = await getBannedUsers();
            if (!bannedUsers.includes(callerNumber)) {
                await banUser(callerNumber);
            }
        } catch (error) {
            console.error(chalk.red('Error handling call:', error));
        }
    });

    client.ev.on("messages.upsert", async (chatUpdate) => {
        let settings = await getSettings();
        if (!settings) return;

        const { autoread, autolike, autoview, presence } = settings;

        try {
            let mek = chatUpdate.messages[0];
            if (!mek || !mek.key || !mek.message) return;

            mek.message = Object.keys(mek.message)[0] === "ephemeralMessage" ? mek.message.ephemeralMessage.message : mek.message;

            const remoteJid = mek.key.remoteJid;
            const sender = client.decodeJid(mek.key.participant || mek.key.remoteJid);
            const Myself = client.decodeJid(client.user.id);

            let buttonId = null;
            if (mek.message?.buttonsResponseMessage?.selectedButtonId) {
                buttonId = mek.message.buttonsResponseMessage.selectedButtonId;
            } else if (mek.message?.templateButtonReplyMessage?.selectedId) {
                buttonId = mek.message.templateButtonReplyMessage.selectedId;
            }

            if (typeof remoteJid === 'string' && remoteJid.endsWith("@g.us")) {
                try {
                    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|bit\.ly\/[^\s]+|t\.me\/[^\s]+|chat\.whatsapp\.com\/[^\s]+)/i;
                    const messageContent = (
                        mek.message.conversation ||
                        mek.message.extendedTextMessage?.text ||
                        mek.message.imageMessage?.caption ||
                        mek.message.videoMessage?.caption ||
                        mek.message.documentMessage?.caption ||
                        buttonId ||
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
                } catch (error) {
                    console.error(chalk.red('Error in antilink logic:', error));
                }
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

            if (!client.public && !mek.key.fromMe && chatUpdate.type === "notify") return;

            m = smsg(client, mek, store);
            if (buttonId) {
                m.text = buttonId;
            }
            require("./toxic")(client, m, chatUpdate, store);
        } catch (err) {
            console.error(chalk.red('[MESSAGES.UPSERT] Error:', err));
        }
    });

    const unhandledRejections = new Map();
    process.on("unhandledRejection", (reason, promise) => {
        unhandledRejections.set(promise, reason);
        console.log(chalk.red("Unhandled Rejection at:", promise, "reason:", reason));
    });
    process.on("rejectionHandled", (promise) => {
        unhandledRejections.delete(promise);
    });
    process.on("Something went wrong", function (err) {
        console.log(chalk.red("Caught exception: ", err));
    });

    client.ev.on("connection.update", async (update) => {
        await connectionHandler(client, update, startToxic);
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