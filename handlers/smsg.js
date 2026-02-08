const {
  default: toxicConnect,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  downloadContentFromMessage,
  jidDecode,
  proto,
  getContentType,
} = require("@whiskeysockets/baileys");
const { readFileSync } = require("fs");
const path = require("path");

const filePath = path.resolve(__dirname, "../toxic.jpg");
const kali = readFileSync(filePath);

function smsg(conn, m, store) {
  if (!m) return {};
  let M = proto.WebMessageInfo;

  if (m.key) {
    m.id = m.key.id;
    m.isBaileys = m.id?.startsWith("BAE5") && m.id.length === 16;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat?.endsWith("@g.us");
    m.sender = conn.decodeJid(
      (m.fromMe && conn.user?.id) ||
      m.key?.participant ||
      m.chat ||
      ""
    );
    if (m.isGroup) m.participant = conn.decodeJid(m.key.participant) || "";
  }

  if (m.message) {
    try {
      m.mtype = getContentType(m.message);
    } catch {
      m.mtype = 'unknown';
    }

    if (m.mtype === "viewOnceMessage" && m.message[m.mtype]) {
      m.msg = m.message[m.mtype].message[getContentType(m.message[m.mtype].message)];
    } else {
      m.msg = m.message[m.mtype];
    }

    m.body =
      m.message?.conversation ||
      m.msg?.caption ||
      m.msg?.text ||
      (m.mtype === "listResponseMessage" && m.msg?.singleSelectReply?.selectedRowId) ||
      (m.mtype === "buttonsResponseMessage" && m.msg?.selectedButtonId) ||
      (m.mtype === "viewOnceMessage" && m.msg?.caption) ||
      "";

    m.text =
      (m.mtype === "buttonsResponseMessage" && m.msg?.selectedButtonId) ||
      m.msg?.text ||
      m.msg?.caption ||
      m.message?.conversation ||
      m.msg?.contentText ||
      m.msg?.selectedDisplayText ||
      m.msg?.title ||
      "";

    let quoted = m.msg?.contextInfo?.quotedMessage;
    m.quoted = quoted || null;
    m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

    if (m.quoted) {
      let type = getContentType(quoted);
      m.quoted = quoted[type];
      if (["productMessage"].includes(type)) {
        type = getContentType(m.quoted);
        m.quoted = m.quoted[type];
      }

      if (typeof m.quoted === "string") m.quoted = { text: m.quoted };

      m.quoted.mtype = type;
      m.quoted.id = m.msg?.contextInfo?.stanzaId;
      m.quoted.chat = m.msg?.contextInfo?.remoteJid || m.chat;
      m.quoted.isBaileys =
        m.quoted.id?.startsWith("BAE5") && m.quoted.id.length === 16;
      m.quoted.sender = conn.decodeJid(m.msg?.contextInfo?.participant);
      m.quoted.fromMe = m.quoted.sender === conn.decodeJid(conn.user?.id);

      m.quoted.text =
        m.quoted.text ||
        m.quoted.caption ||
        m.quoted.conversation ||
        m.quoted.contentText ||
        m.quoted.selectedDisplayText ||
        m.quoted.title ||
        "";

      m.quoted.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];

      m.getQuotedObj = m.getQuotedMessage = async () => {
        if (!m.quoted.id) return false;
        let q = await store.loadMessage(m.chat, m.quoted.id, conn);
        return smsg(conn, q, store);
      };

      let vM = (m.quoted.fakeObj = M.fromObject({
        key: {
          remoteJid: m.quoted.chat,
          fromMe: m.quoted.fromMe,
          id: m.quoted.id,
        },
        message: quoted,
        ...(m.isGroup ? { participant: m.quoted.sender } : {}),
      }));

      m.quoted.delete = () =>
        conn.sendMessage(m.quoted.chat, { delete: vM.key });
      m.quoted.copyNForward = (jid, forceForward = false, options = {}) =>
        conn.copyNForward(jid, vM, forceForward, options);
      m.quoted.download = () => conn.downloadMediaMessage(m.quoted);
    }
  }

  if (m.msg?.url) m.download = () => conn.downloadMediaMessage(m.msg);

  m.text = m.text || m.body || "";

  m.reply = (text, chatId = m.chat, options = {}) => {
    const fakeQuoted = {
      key: {
        participant: "0@s.whatsapp.net",
        remoteJid: "0@s.whatsapp.net",
        id: m.id,
      },
      message: {
        conversation: "Toxic",
      },
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
      },
    };

    return conn.sendMessage(
      chatId,
      {
        text: text,
        contextInfo: {
          externalAdReply: {
            title: `Toxic-MD`,
            body: m.pushName,
            previewType: "PHOTO",
            thumbnailUrl: "https://github.com/xhclintohn/Toxic-MD",
            thumbnail: kali,
            sourceUrl: "https://github.com/xhclintohn/Toxic-MD",
          },
        },
      },
      { quoted: fakeQuoted, ...options }
    );
  };

  m.copy = () => smsg(conn, M.fromObject(M.toObject(m)));
  m.copyNForward = (jid = m.chat, forceForward = false, options = {}) =>
    conn.copyNForward(jid, m, forceForward, options);

  return m;
}

module.exports = { smsg };