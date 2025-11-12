const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { proto, getContentType, generateWAMessageID } = require("@whiskeysockets/baileys");
const { getSettings, updateSetting } = require("../Database/config");

const MESSAGE_STORE_PATH = path.join(__dirname, "../Database/messageStore.json");
const MAX_UPLOAD_SIZE = 256 * 1024 * 1024; // 256MB

// 🧩 Ensure the JSON store exists
function ensureStoreFile() {
  try {
    if (!fs.existsSync(MESSAGE_STORE_PATH)) {
      fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify({}, null, 2), "utf8");
      console.log("✅ Created messageStore.json");
    }
  } catch (err) {
    console.error("❌ Error ensuring message store file:", err);
  }
}

// 🧩 Safe read/write helpers
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

function writeStore(data) {
  try {
    fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ Failed to write message store JSON:", err);
  }
}

// 🧹 Cleanup messages older than 24 hours
function cleanupOldMessages() {
  try {
    const data = readStore();
    const now = Date.now();
    const cutoff = 24 * 60 * 60 * 1000;
    let removed = 0;

    for (const chatId in data) {
      for (const msgId in data[chatId]) {
        const msg = data[chatId][msgId];
        const ts = (msg.timestamp || msg.messageTimestamp || now / 1000) * 1000;
        if (now - ts > cutoff) {
          delete data[chatId][msgId];
          removed++;
        }
      }
      if (Object.keys(data[chatId]).length === 0) delete data[chatId];
    }

    if (removed > 0) {
      writeStore(data);
      console.log(`🧹 Cleaned ${removed} old messages from store`);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
}

setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000); // once per day

// 🧩 Upload function for media
async function uploadMedia(buffer) {
  const tempPath = path.join(__dirname, `temp_${Date.now()}`);
  fs.writeFileSync(tempPath, buffer);

  try {
    const form = new FormData();
    form.append("files[]", fs.createReadStream(tempPath));
    const res = await axios.post("https://qu.ax/upload.php", form, {
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const link = res.data?.files?.[0]?.url;
    if (!link) throw new Error("Upload failed — no URL returned.");
    return link;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

// 🧩 Stylish reply
const fancyReply = (msg) => `◈━━━━━━━━━━━━━━━━◈\n│❒ ${msg}\n┗━━━━━━━━━━━━━━━┛`;

module.exports = async (context) => {
  const { client, m, args } = context;

  try {
    if (!m?.key?.remoteJid) return;

    const myself = client.decodeJid(client.user.id);
    if (m.key.fromMe) {
      const subCommand = args[0]?.toLowerCase();
      const settings = await getSettings();

      if (subCommand === "status") {
        return await m.reply(
          fancyReply(
            `🔍 *Anti-Delete Status*\n\n` +
              `• Enabled: ${settings.antidelete ? "✅ Yes" : "❌ No"}\n` +
              `• Cleanup: Every 24 hours\n` +
              `• Storage: messageStore.json + qu.ax for media`
          )
        );
      }

      const newState = !settings.antidelete;
      await updateSetting("antidelete", newState);
      return await m.reply(
        fancyReply(
          `Antidelete ${newState ? "ENABLED ✅" : "DISABLED ❌"} globally!\n\n` +
            `${newState ? "Deleted messages will be recovered 🔒" : "Anti-delete is now off 😎"}`
        )
      );
    }
  } catch (err) {
    console.error("Antidelete command error:", err);
  }

  // 🚀 Message listener
  client.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg || !msg.key || !msg.key.remoteJid) return; // Only skip truly invalid messages

    const storeData = readStore();

    try {
      // ✅ Handle normal incoming messages
      if (msg.message && !msg.message.protocolMessage) {
        const chatId = msg.key.remoteJid;
        const msgId = msg.key.id;
        const contentType = getContentType(msg.message);

        if (!storeData[chatId]) storeData[chatId] = {};

        let storedMsg = msg;
        // 🧩 Handle media uploads automatically
        if (["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"].includes(contentType)) {
          const mediaMsg = msg.message[contentType];
          if (mediaMsg && mediaMsg.url) {
            const buffer = await client.downloadMediaMessage(msg);
            if (buffer && buffer.length < MAX_UPLOAD_SIZE) {
              const link = await uploadMedia(buffer);
              storedMsg = {
                messageType: contentType,
                url: link,
                caption: mediaMsg.caption || "",
                mimetype: mediaMsg.mimetype,
                timestamp: msg.messageTimestamp,
              };
              console.log(`📤 Uploaded media (${contentType}) to ${link}`);
            }
          }
        }

        storeData[chatId][msgId] = storedMsg;
        writeStore(storeData);
      }

      // 🚫 Handle deleted messages
      const settings = await getSettings();
      if (!settings.antidelete) return;

      if (msg.message?.protocolMessage?.type === 0) {
        const deletedKey = msg.message.protocolMessage.key;
        const chatId = deletedKey.remoteJid;
        const deletedMsgId = deletedKey.id;

        const deletedMsg = storeData?.[chatId]?.[deletedMsgId];
        if (!deletedMsg) return;

        const botJid = client.decodeJid(client.user.id);
        const sender = deletedKey.participant || chatId;
        const isGroup = chatId.endsWith("@g.us");

        const info =
          `⚠️ *Anti-Delete Alert*\n\n` +
          `• From: @${sender.split("@")[0]}\n` +
          `• Chat: ${isGroup ? "Group" : "Private"}\n` +
          `• Time: ${new Date(
            (deletedMsg.timestamp || Date.now() / 1000) * 1000
          ).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}\n\n`;

        // 🧩 Send recovered message
        if (deletedMsg.url) {
          await client.sendMessage(botJid, {
            text: `${info}*Recovered Media:* ${deletedMsg.caption || ""}\n\n${deletedMsg.url}`,
            mentions: [sender],
          });
        } else {
          const textMsg =
            deletedMsg.message?.conversation ||
            deletedMsg.message?.extendedTextMessage?.text ||
            "[No text content found]";
          await client.sendMessage(botJid, {
            text: `${info}*Recovered Message:*\n\n${textMsg}`,
            mentions: [sender],
          });
        }

        console.log(`✅ Recovered deleted message (${deletedMsgId}) from ${chatId}`);
      }
    } catch (err) {
      console.error("❌ Antidelete listener error:", err);
    }
  });

  cleanupOldMessages();
};