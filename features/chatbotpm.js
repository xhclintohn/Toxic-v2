const fetch = require('node-fetch');
  let GROQ_KEY = '';
  try { GROQ_KEY = require('../keys').GROQ_API_KEY || ''; } catch {}

  module.exports = async (client, m, store, chatbotpmSetting) => {
      try {
          if (!m || !m.key || !m.message || !m.key.remoteJid.endsWith('@s.whatsapp.net') || m.key.fromMe) return;
          if (!(chatbotpmSetting === true || chatbotpmSetting === 'true')) return;

          const botNumber = client.decodeJid ? await client.decodeJid(client.user.id) : client.user.id;
          const sender = m.sender ? (client.decodeJid ? await client.decodeJid(m.sender) : m.sender) : null;
          if (!sender || sender === botNumber) return;

          const messageContent = (
              m.message?.conversation ||
              m.message?.extendedTextMessage?.text ||
              m.message?.imageMessage?.caption ||
              m.message?.videoMessage?.caption || ''
          ).trim();

          if (!messageContent) return;

          const ALL_PREFIXES = ['.', '!', '#', '/', '$', '?', '+', '-', '*', '~', '%', '&', '^', '=', '|'];
          if (ALL_PREFIXES.some(p => messageContent.startsWith(p))) return;
          if (!GROQ_KEY || GROQ_KEY === 'REPLACE_WITH_YOUR_GROQ_API_KEY_HERE') return;

          const userNum = sender.split('@')[0].split(':')[0];

          client.sendPresenceUpdate('composing', m.key.remoteJid).catch(() => {});

          let db;
          try { db = require('../database/config'); } catch {}

          const [history] = await Promise.all([
              db?.getConversationHistory ? db.getConversationHistory(userNum, 6).catch(() => []) : Promise.resolve([]),
              db?.clearOldConversationHistory ? db.clearOldConversationHistory(1).catch(() => {}) : Promise.resolve()
          ]);

          if (db?.addConversationMessage) {
              db.addConversationMessage(userNum, 'user', messageContent).catch(() => {});
          }

          const messages = [
              { role: 'system', content: 'You are TOXIC-MD, a savage brutally honest WhatsApp assistant. Answer helpfully but with maximum attitude and sarcasm. Keep it under 3 sentences. No markdown.' },
              ...(Array.isArray(history) ? history.slice(-6).map(h => ({ role: h.role, content: h.message || h.content || '' })) : []),
              { role: 'user', content: messageContent }
          ];

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  model: 'llama-3.1-8b-instant',
                  messages,
                  max_tokens: 150,
                  temperature: 0.8,
                  stream: false
              })
          });

          if (!res.ok) return;
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (!reply) return;

          if (db?.addConversationMessage) {
              db.addConversationMessage(userNum, 'assistant', reply).catch(() => {});
          }

          client.sendPresenceUpdate('paused', m.key.remoteJid).catch(() => {});
          await client.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
      } catch {}
  };
  