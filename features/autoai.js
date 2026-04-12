const fetch = require('node-fetch');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

let GROQ_KEY = '';
try { GROQ_KEY = require('../keys').GROQ_API_KEY || ''; } catch {}

const MEM_TTL = 2 * 60 * 60 * 1000;
const MAX_HIST = 20;
const _mem = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of _mem) if (now - v.ts > MEM_TTL) _mem.delete(k);
}, 20 * 60 * 1000);

function _getHist(uid) {
    const e = _mem.get(uid);
    if (!e || Date.now() - e.ts > MEM_TTL) { _mem.delete(uid); return []; }
    return e.msgs.slice();
}

function _addHist(uid, role, content) {
    const e = _mem.get(uid) || { msgs: [], ts: Date.now() };
    e.msgs.push({ role, content: String(content).slice(0, 2000) });
    if (e.msgs.length > MAX_HIST) e.msgs = e.msgs.slice(-MAX_HIST);
    e.ts = Date.now();
    _mem.set(uid, e);
}

function isClearIntent(t) {
    return /^(clear|reset|wipe|delete|flush|erase)\s*(this\s*)?(conv(ersation)?|chat|hist(ory)?|messages?|thread|memory|mem)$/i.test((t||'').trim());
}

const SYSTEM_PROMPT = `You are TOXIC-MD, a WhatsApp AI assistant built by xh_clinton. Personality: sharp, witty, brutally honest - like a brilliant friend who doesn't sugarcoat things. Rules:
- Be genuinely helpful but with attitude and dry humor when appropriate
- Concise: 1-3 sentences for simple things, more only when truly needed
- No markdown (no **, ##). Plain text only.
- If you see an image, describe it clearly and answer questions about it
- If a document is shared, acknowledge the filename and assist with it
- You remember this conversation
- Never say you're an AI or name your model. You are TOXIC-MD.
- If asked who made you: xh_clinton`;

async function callGroq(messages, useVision) {
    if (!GROQ_KEY) return null;
    try {
        const model = useVision ? 'llama-3.2-11b-vision-preview' : 'llama-3.1-8b-instant';
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, max_tokens: useVision ? 400 : 250, temperature: 0.75, stream: false })
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || null;
    } catch { return null; }
}

async function _downloadBuf(client, m, type) {
    try {
        const inner = m.msg || m.message?.[type + 'Message'];
        if (!inner) return null;
        const stream = await downloadContentFromMessage(inner, type);
        const chunks = [];
        for await (const ch of stream) chunks.push(ch);
        return Buffer.concat(chunks);
    } catch {
        try { return await client.downloadMediaMessage(m); } catch { return null; }
    }
}

const ALL_PREFIXES = ['.','!','#','/','$','?','+','-','*','~','%','&','^','=','|'];

function boxWrap(text) {
      const raw = String(text || '').replace(/\n{3,}/g, '\n\n').trim();
      const lines = raw.split('\n');
      const processed = [];
      for (const line of lines) {
          const t = line.trim();
          if (!t) { processed.push('├'); continue; }
          if (/https?:\/\/\S+/.test(t)) {
              processed.push('├');
              processed.push(`├ ${t}`);
              processed.push('├');
          } else {
              processed.push(`├ ${line}`);
          }
      }
      const body = processed.join('\n');
      return `╭───(    TOXIC-MD    )───\n├───≫ TOXIC-AI ≪───\n├\n${body}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;
  }

  module.exports = async (context) => {
    try {
        const { client, m, settings, botNumber } = context;
        if (!m || !m.key || !m.message) return;
        if (m.key.fromMe) return;

        const autoaiOn = settings.autoai === true || settings.autoai === 'true' || settings.autoai === 'on';
        const chatbotOn = settings.chatbotpm === true || settings.chatbotpm === 'true' || settings.chatbotpm === 'on';
        const isGroup = !!m.isGroup;
        const remoteJid = m.key.remoteJid || m.chat;

        if (isGroup) {
            if (!autoaiOn) return;
            const botNum = (botNumber || '').split('@')[0].split(':')[0];
            const bLidKey = m._botLidKey || '';
            const isMentioned = (m.mentionedJid || m.msg?.contextInfo?.mentionedJid || []).some(j => {
                const jk = (j || '').split('@')[0].split(':')[0];
                return jk === botNum || (bLidKey && jk === bLidKey);
            });
            const isReplyToBot = (() => {
                const qSender = m.msg?.contextInfo?.participant || m.quoted?.sender || '';
                if (!qSender) return false;
                const qk = qSender.split('@')[0].split(':')[0];
                return qk === botNum || (bLidKey && qk === bLidKey);
            })();
            if (!isMentioned && !isReplyToBot) return;
        } else {
            if (!chatbotOn) return;
            if (!remoteJid?.endsWith('@s.whatsapp.net')) return;
        }

        const rawMsg = m.message;
        const msgType = Object.keys(rawMsg || {})[0] || '';

        if (msgType === 'videoMessage' || rawMsg?.videoMessage) return;

        const textContent = (
            rawMsg?.conversation ||
            rawMsg?.extendedTextMessage?.text ||
            rawMsg?.imageMessage?.caption ||
            rawMsg?.documentMessage?.caption ||
            rawMsg?.documentWithCaptionMessage?.message?.documentMessage?.caption ||
            m.body || m.text || ''
        ).trim();

        if (textContent && ALL_PREFIXES.some(p => textContent.startsWith(p))) return;

        const senderNum = (m.sender || m.key.remoteJid || '').split('@')[0].split(':')[0];

        if (textContent && isClearIntent(textContent)) {
            _mem.delete(senderNum);
            try { await client.sendMessage(remoteJid, { react: { text: '🗑️', key: m.key } }); } catch {}
              await client.sendMessage(remoteJid, { text: '╭───(    TOXIC-MD    )───\n├ Memory cleared. Fresh start!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧' }, { quoted: m });
            return;
        }

        try { await client.sendMessage(remoteJid, { react: { text: '🤖', key: m.key } }); } catch {}
          client.sendPresenceUpdate('composing', remoteJid).catch(() => {});

        const hasImage = !!(rawMsg?.imageMessage || msgType === 'imageMessage');
        const hasDoc = !!(rawMsg?.documentMessage || rawMsg?.documentWithCaptionMessage ||
            msgType === 'documentMessage' || msgType === 'documentWithCaptionMessage');

        let userContent;
        let useVision = false;

        if (hasImage) {
            useVision = true;
            try {
                const buf = await _downloadBuf(client, m, 'image');
                if (buf && buf.length > 0) {
                    const mime = rawMsg?.imageMessage?.mimetype || 'image/jpeg';
                    userContent = [
                        { type: 'text', text: textContent || 'What do you see in this image?' },
                        { type: 'image_url', image_url: { url: `data:${mime};base64,${buf.toString('base64')}` } }
                    ];
                } else {
                    userContent = textContent || 'Describe this image';
                    useVision = false;
                }
            } catch {
                userContent = textContent || 'An image was sent';
                useVision = false;
            }
        } else if (hasDoc) {
            const doc = rawMsg?.documentMessage ||
                rawMsg?.documentWithCaptionMessage?.message?.documentMessage;
            const fname = doc?.fileName || 'document';
            userContent = textContent
                ? `[Document: "${fname}"] ${textContent}`
                : `[Document: "${fname}"] Can you help me with this?`;
        } else if (textContent) {
            userContent = textContent;
        } else {
            client.sendPresenceUpdate('paused', remoteJid).catch(() => {});
            return;
        }

        const history = _getHist(senderNum);
        _addHist(senderNum, 'user', typeof userContent === 'string' ? userContent : textContent || '[media]');

        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: userContent }
        ];

        const reply = await callGroq(apiMessages, useVision);
        client.sendPresenceUpdate('paused', remoteJid).catch(() => {});
        if (!reply) return;

        _addHist(senderNum, 'assistant', reply);
        const boxedReply = boxWrap(reply);
        await client.sendMessage(remoteJid, { text: boxedReply }, { quoted: m });
        try { await client.sendMessage(remoteJid, { react: { text: '✅', key: m.key } }); } catch {}
    } catch {
        try { await client.sendMessage(remoteJid, { react: { text: '❌', key: m.key } }); } catch {}
    }
};
