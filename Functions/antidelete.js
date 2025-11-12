const fs = require("fs");
const path = require("path");

const STORE_PATH = path.join(__dirname, "..", "store.json");

// Ensure store.json exists
function ensureStore() {
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ messages: {} }, null, 2));
  }
}

// Save a message when received
function saveMessage(msg) {
  ensureStore();
  const store = JSON.parse(fs.readFileSync(STORE_PATH));
  if (!msg.key || !msg.key.id) return;

  const id = msg.key.id;
  store.messages[id] = {
    key: msg.key,
    message: msg.message,
    fromMe: msg.key.fromMe || false,
    remoteJid: msg.key.remoteJid
  };

  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

// Handle deleted messages
async function handleDelete(sock, deletedMsg) {
  ensureStore();
  const store = JSON.parse(fs.readFileSync(STORE_PATH));
  const id = deletedMsg.key.id;
  const data = store.messages[id];
  if (!data) return;

  const chat = data.remoteJid;
  const sender = data.key.participant || data.key.remoteJid;

  await sock.sendMessage(chat, {
    text: `🧩 *Anti-Delete Detected!*\nA message from @${sender.split("@")[0]} was deleted.\n\nReposting it below 👇`,
    mentions: [sender]
  });

  try {
    await sock.sendMessage(chat, { forward: data });
  } catch {
    await sock.sendMessage(chat, { text: "⚠️ Unable to restore deleted message content." });
  }
}

// Main antidelete setup
async function antidelete(sock, msg) {
  // Listen for new messages
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m || !m.message) return;
    saveMessage(m);
  });

  // Listen for deletions
  sock.ev.on("message-revoke", async (event) => {
    if (!event || !event.key) return;
    await handleDelete(sock, event);
  });

  console.log("✅ Anti-Delete system active!");
}

module.exports = { antidelete };