const middleware = require("../../utils/botUtil/middleware");
module.exports = async _0x4dc5e7 => {
  await middleware(_0x4dc5e7, async () => {
    const {
      client: _0x5377ad,
      m: _0x4ac4f8,
      args: _0x2a9e6b,
      participants: _0x38d862,
      mycode: _0x5b3bed
    } = _0x4dc5e7;
    let _0x2f8982 = _0x38d862.filter(_0x3c9d8b => !_0x3c9d8b.admin).map(_0x1db3fb => _0x1db3fb.id).filter(_0x475052 => !_0x475052.startsWith(_0x5b3bed) && _0x475052 != _0x5377ad.decodeJid(_0x5377ad.user.id));
    if (!_0x2a9e6b || !_0x2a9e6b[0]) {
      if (_0x2f8982.length == 0) {
        return _0x4ac4f8.reply("╭───(    TOXIC-MD    )───\n├ No foreigners detected. Group is clean, for now.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
      }
      let _0x2d7d67 = "╭───(    TOXIC-MD    )───\n├───≫ FOREIGNERS ≪───\n├ \n├ Country code not matching: " + _0x5b3bed + "\n├ Found " + _0x2f8982.length + " unwanted guests:\n├ \n";
      for (let _0x28761c of _0x2f8982) {
        _0x2d7d67 += "├ @" + _0x28761c.split("@")[0] + "\n";
      }
      _0x2d7d67 += "├ \n├ Send .foreigners -x to yeet them all\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧";
      _0x5377ad.sendMessage(_0x4ac4f8.chat, {
        text: _0x2d7d67,
        mentions: _0x2f8982
      }, {
        quoted: _0x4ac4f8
      });
    } else if (_0x2a9e6b[0] == "-x") {
      setTimeout(() => {
        _0x5377ad.sendMessage(_0x4ac4f8.chat, {
          text: "╭───(    TOXIC-MD    )───\n├───≫ PURGE MODE ≪───\n├ \n├ Removing all " + _0x2f8982.length + " foreigners now.\n├ Goodbye losers, you won't be missed.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧"
        }, {
          quoted: _0x4ac4f8
        });
        setTimeout(() => {
          _0x5377ad.groupParticipantsUpdate(_0x4ac4f8.chat, _0x2f8982, "remove");
          setTimeout(() => {
            _0x4ac4f8.reply("╭───(    TOXIC-MD    )───\n├ All foreigners removed. Group cleansed.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
          }, 1000);
        }, 1000);
      }, 1000);
    }
  });
};
