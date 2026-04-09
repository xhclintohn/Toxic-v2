const fetch = require('node-fetch');

module.exports = async (client, m, store, chatbotpmSetting) => {
    try {
        if (!m || !m.key || !m.message || !m.key.remoteJid.endsWith('@s.whatsapp.net') || m.key.fromMe) return;
        if (!(chatbotpmSetting === true || chatbotpmSetting === 'true')) return;

        const botNumber = await client.decodeJid(client.user.id);
        const sender = m.sender ? await client.decodeJid(m.sender) : null;
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

        const GROQ_KEY = process.env.GROQ_API_KEY || (() => { try { return require('../keys').GROQ_API_KEY; } catch { return ''; } })();
        if (!GROQ_KEY) return;

        const userNum = sender.split('@')[0].split(':')[0];

        let addConversationMessage, getConversationHistory, clearOldConversationHistory;
        try {
            const db = require('../database/config');
            addConversationMessage = db.addConversationMessage;
            getConversationHistory = db.getConversationHistory;
            clearOldConversationHistory = db.clearOldConversationHistory;
        } catch {}

        if (clearOldConversationHistory) {
            try { clearOldConversationHistory(1); } catch {}
        }

        let history = [];
        if (getConversationHistory) {
            try { history = await getConversationHistory(userNum, 20); } catch {}
        }

        if (addConversationMessage) {
            try { await addConversationMessage(userNum, 'user', messageContent); } catch {}
        }

        const messages = [
            { role: 'system', content: 'You are TOXIC-MD, a savage brutally honest WhatsApp assistant. Answer helpfully but with maximum attitude and sarcasm. Keep it under 3 sentences. Remember the conversation context.' }
        ];

        for (const entry of history) {
            messages.push({ role: entry.role, content: entry.message });
        }

        messages.push({ role: 'user', content: messageContent });

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                max_tokens: 200,
                temperature: 0.8
            })
        });

        if (!res.ok) return;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) return;

        if (addConversationMessage) {
            try { await addConversationMessage(userNum, 'assistant', reply); } catch {}
        }

        await client.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
    } catch {}
};
