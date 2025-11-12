/**
 * Functions/antidelete.js
 *
 * - Stores messages (text + metadata) in Database/messageStore.json
 * - Uploads media to qu.ax and stores the returned URL instead of raw buffer
 * - Recovers deleted messages and sends them to the bot's own DM (self)
 * - Auto-creates message store file if missing
 * - Cleans up messages older than 24 hours (startup + every 24h)
 * - Registers a single messages.upsert listener (no duplicates)
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { proto, getContentType, generateWAMessageID } = require("@whiskeysockets/baileys");
const { getSettings, updateSetting } = require("../Database/config");

const MESSAGE_STORE_PATH = path.join(__dirname, "../Database/messageStore.json");
const MAX_UPLOAD_SIZE = 256 * 1024 * 1024; // 256MB
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Ensure store file exists
function ensureStoreFile() {
  try {
    if (!fs.existsSync(MESSAGE_STORE_PATH)) {
      fs.mkdirSync(path.dirname(MESSAGE_STORE_PATH), { recursive: true });
      fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify({}, null, 2), "utf8");
      console.log("✅ messageStore.json created");
    }
  } catch (err) {
    console.error("❌ ensureStoreFile error:", err);
  }
}

function readStore() {
  ensureStoreFile();
  try {
    const raw = fs.readFileSync(MESSAGE_STORE_PATH, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("⚠️ readStore JSON parse error, resetting store:", err);
    try { fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify({}, null, 2), "utf8"); } catch(e){}
    return {};
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(MESSAGE_STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("⚠️ writeStore error:", err);
  }
}

// Cleanup old messages (> 24 hours)
function cleanupOldMessages() {
  try {
    const data = readStore();
    const now = Date.now();
    const cutoff = CLEANUP_INTERVAL_MS;
    let removed = 0;

    for (const chatId of Object.keys(data)) {
      for (const msgId of Object.keys(data[chatId])) {
        const entry = data[chatId][msgId];
        const ts = (entry.timestamp || entry.messageTimestamp || (now / 1000)) * 1000;
        if (now - ts > cutoff) {
          delete data[chatId][msgId];
          removed++;
        }
      }
      if (Object.keys(data[chatId]).length === 0) delete data[chatId];
    }

    if (removed > 0) {
      writeStore(data);
      console.log(`🧹 antidelete: cleaned ${removed} old messages`);
    }
  } catch (err) {
    console.error("❌ cleanupOldMessages error:", err);
  }
}

// Upload buffer to qu.ax (returns URL string)
async function uploadToQuAx(buffer, filename = `file-${Date.now()}`) {
  const tmpPath = path.join(__dirname, `tmp_upload_${Date.now()}`);
  try {
    fs.writeFileSync(tmpPath, buffer);
    const form = new FormData();
    form.append("files[]", fs.createReadStream(tmpPath), {
      filename
    });

    const res = await axios.post("https://qu.ax/upload.php", form, {
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    });

    const link = res?.data?.files?.[0]?.url;
    if (!link) throw new Error("Upload returned no URL");
    return link;
  } finally {
    if (fs.existsSync(tmpPath)) {
      try { fs.unlinkSync(tmpPath); } catch (e) {}
    }
  }
}

// Try to extract a Buffer for media from various possible APIs
async function attemptDownloadMedia(client, msg, contentType) {
  // Several Baileys wrappers expose different helpers.
  // Try common ones safely.
  try {
    // 1) If message object has .download method (some wrappers provide)
    if (typeof msg?.download === "function") {
      try {
        const buf = await msg.download();
        if (Buffer.isBuffer(buf)) return buf;
      } catch (e) {}
    }

    // 2) If the client provides downloadMediaMessage
    if (typeof client?.downloadMediaMessage === "function") {
      try {
        const buf = await client.downloadMediaMessage(msg);
        if (Buffer.isBuffer(buf)) return buf;
      } catch (e) {}
    }

    // 3) If Baileys v4+ downloadContentFromMessage exists on client
    if (typeof client?.downloadContentFromMessage === "function") {
      try {
        const stream = await client.downloadContentFromMessage(msg.message[contentType], contentType.replace("Message", ""));
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
      } catch (e) {}
    }

    // 4) If msg.message[contentType] has a 'url' pointing to WhatsApp CDN (rare), try client.fetch
    // fallback: nothing available
    return null;
  } catch (err) {
    console.error("attemptDownloadMedia error:", err);
    return null;
  }
}

const fancyReply = (message) => `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;

// Register listener flag to avoid duplicates
function ensureListenerRegistered(client) {
  if (client._antideleteListenerRegistered) return;
  client._antideleteListenerRegistered = true;

  client.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg || !msg.key || !msg.key.remoteJid) {
      // truly invalid message - ignore quietly
      return;
    }

    try {
      const storeData = readStore();
      const chatId = msg.key.remoteJid;
      const msgId = msg.key.id;
      const contentType = getContentType(msg.message || {}) || "";

      // Ensure container exists
      if (!storeData[chatId]) storeData[chatId] = {};

      // STORE regular messages (non-protocol)
      try {
        if (msg.message && !msg.message.protocolMessage) {
          // default timestamp
          if (!msg.messageTimestamp) msg.messageTimestamp = Math.floor(Date.now() / 1000);

          // Text / simple messages: keep the message object (safe)
          const isMedia = ["imageMessage","videoMessage","audioMessage","documentMessage","stickerMessage"].includes(contentType);

          if (isMedia) {
            // attempt to download and upload to qu.ax; but do it safely
            try {
              const buffer = await attemptDownloadMedia(client, msg, contentType);
              if (buffer && Buffer.isBuffer(buffer) && buffer.length <= MAX_UPLOAD_SIZE) {
                const filename = `${contentType.replace("Message","")}_${Date.now()}`;
                const url = await uploadToQuAx(buffer, filename);
                // store simplified media record
                storeData[chatId][msgId] = {
                  type: "media",
                  contentType,
                  url,
                  caption: (msg.message[contentType]?.caption || msg.message[contentType]?.fileName || "") ,
                  mimetype: msg.message[contentType]?.mimetype || "",
                  timestamp: msg.messageTimestamp,
                  sender: msg.key.participant || msg.key?.fromMe ? (msg.key?.participant || msg.key?.fromMe) : (msg.key?.participant || msg.key?.remoteJid)
                };
                writeStore(storeData);
                // done storing media
                return;
              } else {
                // fallback: store message object as-is (so we can at least reconstruct text or forward if possible)
                storeData[chatId][msgId] = {
                  type: "raw",
                  raw: msg,
                  timestamp: msg.messageTimestamp,
                };
                writeStore(storeData);
                return;
              }
            } catch (errMedia) {
              // On media upload failure, still store raw message as fallback
              console.error("antidelete: media upload error, storing raw fallback:", errMedia);
              storeData[chatId][msgId] = {
                type: "raw",
                raw: msg,
                timestamp: msg.messageTimestamp,
              };
              writeStore(storeData);
              return;
            }
          } else {
            // Non-media: store text/raw message for recovery
            storeData[chatId][msgId] = {
              type: "text",
              message:
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                msg.message?.conversation ||
                msg.message,
              raw: msg, // keep original for safety
              timestamp: msg.messageTimestamp,
            };
            writeStore(storeData);
            return;
          }
        }
      } catch (errStore) {
        console.error("antidelete: error while storing message:", errStore);
      }

      // HANDLE DELETIONS: protocolMessage type === 0
      try {
        const settings = await getSettings();
        if (!settings || !settings.antidelete) return;

        if (msg.message?.protocolMessage?.type === 0) {
          const deletedKey = msg.message.protocolMessage.key;
          const deletedChatId = deletedKey.remoteJid;
          const deletedMsgId = deletedKey.id;

          const recovered = (readStore())[deletedChatId]?.[deletedMsgId];
          if (!recovered) {
            // nothing stored for this id
            return;
          }

          // target: bot's own DM (self)
          // prefer client.user?.id if available (Baileys socket.user.id style)
          let botJid = client?.user?.id || client?.sock?.user?.id || null;
          if (!botJid) {
            try {
              botJid = client.decodeJid(client.user?.id || "");
            } catch (e) {
              botJid = null;
            }
          }
          // final fallback: send to remoteJid of bot (client.user.id) but must be a string
          if (!botJid) {
            console.error("antidelete: cannot determine bot JID to send recovered message to.");
            return;
          }

          const sender = deletedKey.participant || deletedChatId;
          const isGroup = String(deletedChatId).endsWith("@g.us");

          const headerText =
            `⚠️ *Anti-Delete Alert*\n\n` +
            `• From: @${String(sender).split("@")[0]}\n` +
            `• Chat Type: ${isGroup ? "Group" : "Private"}\n` +
            `• Time: ${new Date((recovered.timestamp || Date.now() / 1000) * 1000).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })}\n\n`;

          // If stored as media with url
          if (recovered.type === "media" && recovered.url) {
            try {
              await client.sendMessage(botJid, {
                text: `${headerText}*Recovered Media:*\n\n${recovered.caption || ""}\n\n${recovered.url}`,
                mentions: [sender],
              });
            } catch (errSend) {
              console.error("antidelete: failed to send recovered media message:", errSend);
            }
          } else if (recovered.type === "text") {
            const textContent = recovered.message || "[No text found]";
            try {
              await client.sendMessage(botJid, { text: `${headerText}*Recovered Message:*\n\n${textContent}`, mentions: [sender] });
            } catch (errSend) {
              console.error("antidelete: failed to send recovered text:", errSend);
            }
          } else if (recovered.type === "raw" && recovered.raw) {
            // Try to forward raw message if possible, else send text fallback.
            try {
              // If the raw message is a full WebMessageInfo-like object, convert to proto and relay
              try {
                const rawObj = recovered.raw;
                // If it contains message, try to forward by sending a copy to botJid
                // Many bailey wrappers allow client.relayMessage or client.copyNForward; try safe methods
                if (typeof client.relayMessage === "function") {
                  const webMsg = proto.WebMessageInfo.fromObject(rawObj);
                  await client.relayMessage(botJid, webMsg.message, { messageId: generateWAMessageID() });
                } else if (typeof client.copyNForward === "function") {
                  // try copyNForward if available
                  await client.copyNForward(botJid, rawObj, true);
                } else {
                  // fallback to extracting text
                  const textMsg = rawObj.message?.conversation || rawObj.message?.extendedTextMessage?.text || "[No preview available]";
                  await client.sendMessage(botJid, { text: `${headerText}*Recovered Message:*\n\n${textMsg}`, mentions: [sender] });
                }
              } catch (errForward) {
                // fallback: send text preview
                const rawObj = recovered.raw;
                const textMsg = rawObj.message?.conversation || rawObj.message?.extendedTextMessage?.text || "[No preview available]";
                await client.sendMessage(botJid, { text: `${headerText}*Recovered Message:*\n\n${textMsg}`, mentions: [sender] });
              }
            } catch (errSendRaw) {
              console.error("antidelete: error sending raw recovered message:", errSendRaw);
            }
          }

          // Optionally: remove this recovered message from store now (so it won't be re-sent)
          try {
            const s = readStore();
            if (s[deletedChatId] && s[deletedChatId][deletedMsgId]) {
              // keep it until cleanup, or you can delete immediately:
              // delete s[deletedChatId][deletedMsgId];
              // if (Object.keys(s[deletedChatId]).length === 0) delete s[deletedChatId];
              // writeStore(s);
            }
          } catch (e) {}
        }
      } catch (errDel) {
        console.error("antidelete: deletion handling error:", errDel);
      }
    } catch (errOuter) {
      console.error("antidelete: unexpected listener error:", errOuter);
    }
  });
}

// Main exported function: used by your context-based command system
module.exports = async (context = {}) => {
  // context might include client and m when used as a command, or only client when called at startup
  const { client, m, args } = context;

  ensureStoreFile();
  cleanupOldMessages(); // initial run
  setInterval(cleanupOldMessages, CLEANUP_INTERVAL_MS);

  // Register listener once
  if (client) {
    try {
      ensureListenerRegistered(client);
    } catch (e) {
      console.error("antidelete: ensureListenerRegistered error:", e);
    }
  }

  // If invoked as a command with message object (toggle/status), handle it here
  if (m && m.key && m.key.fromMe) {
    try {
      const sub = (args && args[0]) ? args[0].toLowerCase() : null;
      const settings = await getSettings();

      if (sub === "status") {
        return await m.reply(fancyReply(
          `🔍 *Anti-Delete Status*\n\n• Enabled: ${settings.antidelete ? "✅ Yes" : "❌ No"}\n• Storage: messageStore.json + qu.ax\n• Cleanup: every 24 hours`
        ));
      }

      const newState = !settings.antidelete;
      await updateSetting("antidelete", newState);
      return await m.reply(fancyReply(`Antidelete ${newState ? "ENABLED ✅" : "DISABLED ❌"} globally!`));
    } catch (errCmd) {
      console.error("antidelete: command section error:", errCmd);
    }
  }

  // otherwise just return quietly
  return;
};