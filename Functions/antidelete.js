const fs = require("fs");
const path = require("path");
const { getSettings, updateSetting } = require("../Database/config");
const { proto, getContentType, generateWAMessageID } = require("@whiskeysockets/baileys");

const MESSAGE_STORE_PATH = path.join(__dirname, "../Database/messageStore.json");

// 🧩 Ensure JSON store file exists
function ensureStoreFile() {
  try {
    if (!fs.existsSync(MESSAGE_STORE_PATH)) {
      fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify({}, null, 2), "utf8");
      console.log("✅ messageStore.json created successfully.");
    }
  } catch (err) {
    console.error("❌ Error ensuring message store file:", err);
  }
}

// 🧩 Read message store safely
function readStore() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(MESSAGE_STORE_PATH, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("⚠️ Failed to parse message store JSON:", err);
    return {};
  }
}

// 🧩 Write message store safely
function writeStore(data) {
  try {
    fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ Failed to write message store JSON:", err);
  }
}

// 🧩 Cleanup old messages (> 24 hours)
function cleanupOldMessages() {
  try {
    const data = readStore();
    const now = Date.now();
    const cutoff = 24 * 60 * 60 * 1000; // 24 hours

    let cleanedCount = 0;

    for (const chatId in data) {
      for (const msgId in data[chatId]) {
        const msg = data[chatId][msgId];
        const msgTimestamp =
          (msg.messageTimestamp || msg.timestamp || now / 1000) * 1000;

        if (now - msgTimestamp > cutoff) {
          delete data[chatId][msgId];
          cleanedCount++;
        }
      }
      // remove empty chat objects
      if (Object.keys(data[chatId]).length === 0) {
        delete data[chatId];
      }
    }

    if (cleanedCount > 0) {
      writeStore(data);
      console.log(`🧹 Cleaned ${cleanedCount} old messages from messageStore.json`);
    }
  } catch (err) {
    console.error("⚠️ Error during cleanup:", err);
  }
}

// Schedule cleanup every 24h
setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);

// 🧩 Helper: reply style
const formatStylishReply = (message) => {
  return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
};

module.exports = async (context) => {
  const { client, m, args } = context;

  try {
    if (!m || !m.key || !m.key.remoteJid) {
      console.log("⚠️ Skipping antidelete: invalid message object");
      return;
    }

    const myself = client.decodeJid(client.user.id);

    // Only bot owner (fromMe) can toggle command
    if (m.key.fromMe) {
      const subCommand = args[0]?.toLowerCase();
      const settings = await getSettings();

      if (subCommand === "status") {
        return await m.reply(
          formatStylishReply(
            `🔍 *Anti-Delete Status*\n\n` +
              `• Enabled: ${settings.antidelete ? "✅ Yes" : "❌ No"}\n` +
              `• Storage: Local JSON\n` +
              `• Cleanup: Every 24 Hours`
          )
        );
      }

      const newState = !settings.antidelete;
      await updateSetting("antidelete", newState);

      return await m.reply(
        formatStylishReply(
          `Antidelete ${newState ? "ENABLED" : "DISABLED"} globally!\n\n` +
            `${newState ? "Deleted messages will be recovered 🔒" : "Antidelete disabled 😎"}`
        )
      );
    }
  } catch (err) {
    console.error("❌ Error in antidelete command section:", err);
  }

  // ⚙️ EVENT HANDLER SECTION
  client.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg || !msg.key || !msg.key.remoteJid) return;

    const storeData = readStore();

    // ✅ STORE ALL NORMAL MESSAGES
    try {
      if (msg.message && !msg.message.protocolMessage) {
        const chatId = msg.key.remoteJid;
        const msgId = msg.key.id;

        if (!storeData[chatId]) storeData[chatId] = {};

        // Add timestamp if not present
        if (!msg.messageTimestamp) msg.messageTimestamp = Math.floor(Date.now() / 1000);

        storeData[chatId][msgId] = msg;
        writeStore(storeData);
      }
    } catch (err) {
      console.error("⚠️ Error saving message to store:", err);
    }

    // 🚫 HANDLE DELETED MESSAGES
    try {
      const settings = await getSettings();
      if (!settings.antidelete) return;

      if (msg.message?.protocolMessage?.type === 0) {
        const deletedKey = msg.message.protocolMessage.key;
        const chatId = deletedKey.remoteJid;
        const deletedMsgId = deletedKey.id;

        const chatStore = storeData[chatId];
        const deletedMsg = chatStore ? chatStore[deletedMsgId] : null;

        if (!deletedMsg) {
          console.log(`⚠️ No stored message found for ID ${deletedMsgId} in ${chatId}`);
          return;
        }

        const botJid = client.decodeJid(client.user.id);
        const sender = deletedKey.participant || chatId;
        const isGroup = chatId.endsWith("@g.us");
        const messageType = getContentType(deletedMsg.message);

        const caption =
          `⚠️ *Anti-Delete Detection*\n\n` +
          `• From: @${sender.split("@")[0]}\n` +
          `• Chat: ${isGroup ? "Group" : "Private"}\n` +
          `• Type: ${messageType}\n` +
          `• Time: ${new Date(
            (deletedMsg.messageTimestamp || Date.now() / 1000) * 1000
          ).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}\n\n` +
          `*Recovered Message:*`;

        await client.sendMessage(botJid, { text: caption, mentions: [sender] });

        const msgObj = proto.WebMessageInfo.fromObject(deletedMsg);
        await client.relayMessage(botJid, msgObj.message, {
          messageId: generateWAMessageID(),
        });

        console.log(`✅ Recovered deleted ${messageType} message ${deletedMsgId} from ${chatId}`);
      }
    } catch (err) {
      console.error("❌ Error recovering deleted message:", err);
    }
  });

  // 🧹 Initial cleanup run at startup
  cleanupOldMessages();
};