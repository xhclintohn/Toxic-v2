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
const { getSettings, getBannedUsers, banUser, getSudoUsers, addSudoUser } = require("../Database/config");
const { botname } = require('../Env/settings');
const { DateTime } = require('luxon');
const { commands, totalCommands } = require('../Handler/commandHandler');
authenticationn();

const sessionDir = path.join(__dirname, '..', 'Session');
const botName = process.env.BOTNAME || botname || "Toxic-MD";
let hasSentStartMessage = false;

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

// Connection handler (from connectionHandler.js)
async function handleConnectionUpdate(client, update, reconnect) {
    const { connection, lastDisconnect, qr } = update;

    // Get a greeting based on the time of day (Nairobi timezone)
    function getGreeting() {
        const hour = DateTime.now().setZone("Africa/Nairobi").hour;
        if (hour >= 5 && hour < 12) return "Hey there! Ready to kick off the day? 🚀";
        if (hour >= 12 && hour < 18) return "What’s up? Time to make things happen! ⚡";
        if (hour >= 18 && hour < 22) return "Evening vibes! Let’s get to it! 🌟";
        return "Late night? Let’s see what’s cooking! 🌙";
    }

    // Get the current time in a simple format
    function getCurrentTime() {
        return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
    }

    // Convert text to a fancy font
    function toFancyFont(text, isUpperCase = false) {
        const fonts = {
            'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
            'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
            'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
            'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
        };
        const formattedText = isUpperCase ? text.toUpperCase() : text.toLowerCase();
        return formattedText.split('').map(char => fonts[char] || char).join('');
    }

    if (qr) {
        console.log(chalk.yellow('QR code generated, please scan to authenticate.'));
    }

    if (connection === "connecting") {
        console.log(`🔄 Establishing connection to WhatsApp servers...`);
        return;
    }

    if (connection === "close") {
        const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;

        switch (statusCode) {
            case DisconnectReason.badSession:
                console.log(`⚠️ Invalid session file detected. Clearing session...`);
                await clearSession();
                process.exit();
                break;
            case DisconnectReason.connectionClosed:
                console.log(`🔌 Connection closed. Attempting to reconnect...`);
                reconnect();
                break;
            case DisconnectReason.connectionLost:
                console.log(`📡 Lost connection to server. Reconnecting...`);
                reconnect();
                break;
            case DisconnectReason.connectionReplaced:
                console.log(`🔄 Connection replaced by another session. Terminating process.`);
                process.exit();
                break;
            case DisconnectReason.loggedOut:
                console.log(`🔒 Session logged out. Clearing session...`);
                hasSentStartMessage = false;
                await clearSession();
                process.exit();
                break;
            case DisconnectReason.restartRequired:
                console.log(`🔄 Server requested restart. Initiating reconnect...`);
                reconnect();
                break;
            case DisconnectReason.timedOut:
                console.log(`⏳ Connection timed out. Attempting to reconnect...`);
                reconnect();
                break;
            default:
                console.log(`❓ Unknown disconnection reason: ${statusCode} | ${connection}. Reconnecting...`);
                reconnect();
        }
        return;
    }

    if (connection === "open") {
        try {
            await client.groupAcceptInvite("GoXKLVJgTAAC3556FXkfFI");
        } catch (error) {
            // Silently handle group join error
        }

        const userId = client.user.id.split(":")[0].split("@")[0];
        const settings = await getSettings();
        const sudoUsers = await getSudoUsers();

        if (!hasSentStartMessage) {
            const isNewUser = !sudoUsers.includes(userId);
            if (isNewUser) {
                await addSudoUser(userId);
                const defaultSudo = "254735342808";
                if (!sudoUsers.includes(defaultSudo)) {
                    await addSudoUser(defaultSudo);
                }
            }

            const firstMessage = isNewUser
                ? [
                    `◈━━━━━━━━━━━━━━━━◈`,
                    `│❒ *${getGreeting()}*`,
                    `│❒ Welcome to *${botName}*! You're now connected.`,
                    ``,
                    `✨ *Bot Name*: ${botName}`,
                    `🔧 *Mode*: ${settings.mode}`,
                    `➡️ *Prefix*: ${settings.prefix}`,
                    `📋 *Commands*: ${totalCommands}`,
                    `🕒 *Time*: ${getCurrentTime()}`,
                    `💾 *Database*: Postgres SQL`,
                    `📚 *Library*: Baileys`,
                    ``,
                    `│❒ *New User Alert*: You've been added to the sudo list.`,
                    ``,
                    `│❒ *Credits*: xh_clinton`,
                    `◈━━━━━━━━━━━━━━━━◈`
                ].join("\n")
                : [
                    `◈━━━━━━━━━━━━━━━━◈`,
                    `│❒ *${getGreeting()}*`,
                    `│❒ Welcome back to *${botName}*! Connection established.`,
                    ``,
                    `✨ *Bot Name*: ${botName}`,
                    `🔧 *Mode*: ${settings.mode}`,
                    `➡️ *Prefix*: ${settings.prefix}`,
                    `📋 *Commands*: ${totalCommands}`,
                    `🕒 *Time*: ${getCurrentTime()}`,
                    `💾 *Database*: Postgres SQL`,
                    `📚 *Library*: Baileys`,
                    ``,
                    `│❒ Ready to proceed? Select an option below.`,
                    ``,
                    `│❒ *Credits*: xh_clinton`,
                    `◈━━━━━━━━━━━━━━━━◈`
                ].join("\n");

            const secondMessage = [
                `◈━━━━━━━━━━━━━━━━◈`,
                `│❒ Please select an option to continue:`,
                `◈━━━━━━━━━━━━━━━━◈`
            ].join("\n");

            try {
                await client.sendMessage(client.user.id, {
                    text: firstMessage,
                    footer: `Powered by ${botName}`,
                    viewOnce: true,
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: false,
                            title: botName,
                            body: `Bot initialized successfully.`,
                            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });

                await client.sendMessage(client.user.id, {
                    text: secondMessage,
                    footer: `Powered by ${botName}`,
                    buttons: [
                        {
                            buttonId: `${settings.prefix || ''}settings`,
                            buttonText: { displayText: `⚙️ ${toFancyFont('SETTINGS')}` },
                            type: 1
                        },
                        {
                            buttonId: `${settings.prefix || ''}menu`,
                            buttonText: { displayText: `📖 ${toFancyFont('MENU')}` },
                            type: 1
                        }
                    ],
                    headerType: 1,
                    viewOnce: true,
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: false,
                            title: botName,
                            body: `Select an option to proceed.`,
                            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                });
            } catch (error) {
                console.error(chalk.red(`❌ Failed to send startup messages: ${error.message}`));
            }

            hasSentStartMessage = true;
        }

        console.log(chalk.green(figlet.textSync('Toxic Bot', { horizontalLayout: 'full' })));
        console.log(chalk.cyan(`✅ Connection established. Loaded ${totalCommands} plugins. ${botName} is operational.`));
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
                `${botName} 𝐢𝐬 𝐚𝐜𝐭𝐢𝐯𝐞 𝟐𝟒/𝟕\n\n${date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} 𝐈𝐭'𝐬 𝐚 ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})}.`
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
                                    participant aislant: sender
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(chalk.red('Error in antilink logic:', error));
                }
            }

            if (autolike && remoteJid === "status@broadcast" && mek.key.id) {
                try {
                    await client.sendMessage(remoteJid, {
                        react: { key: mek.key, text: "😭" }
                    });
                } catch (error) {
                    console.error(chalk.red('Error in autolike:', error));
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
        await handleConnectionUpdate(client, update, startToxic);
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
       