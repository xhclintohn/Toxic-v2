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

        let GROQ_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_KEY) {
            try { GROQ_KEY = require('../keys').GROQ_API_KEY; } catch {}
        }
        if (!GROQ_KEY) return;

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are TOXIC-MD, a savage brutally honest WhatsApp assistant. Answer helpfully but with maximum attitude and sarcasm. Keep it under 3 sentences.' },
                    { role: 'user', content: messageContent }
                ],
                max_tokens: 200,
                temperature: 0.8
            })
        });

        if (!res.ok) return;
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) return;

        await client.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
    } catch {}
};
