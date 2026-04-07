const axios = require('axios');
const fetch = require('node-fetch');
const { commands, aliases } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

async function callAI(prompt) {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
        try {
            const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama3-70b-8192',
                messages: [
                    {
                        role: 'system',
                        content: `You are Toxic-MD, a savage no-filter WhatsApp AI assistant. Rules: if the user wants a bot command action, reply ONLY with CMD:commandname args. Otherwise be savage and short (max 150 chars).`
                    },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 200,
                temperature: 0.85
            }, {
                headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
                timeout: 12000
            });
            const text = result.data?.choices?.[0]?.message?.content?.trim();
            if (text) return text;
        } catch (e) {
            console.error('❌ [AUTOAI GROQ ERROR]:', e.message);
        }
    }

    try {
        const encodedText = encodeURIComponent(prompt);
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), 10000);
        let res;
        try {
            res = await fetch(`https://api.nexray.web.id/ai/chatgpt?text=${encodedText}`, { signal: controller.signal });
        } finally {
            clearTimeout(t);
        }
        if (!res.ok) throw new Error(`nexray status ${res.status}`);
        const data = await res.json();
        if (data?.result) return data.result;
    } catch (e) {
        console.error('❌ [AUTOAI NEXRAY ERROR]:', e.message);
    }

    return null;
}

module.exports = async (context) => {
    const { client, m, body, prefix } = context;

    const messageText = (
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        body ||
        m.text ||
        ''
    ).trim();

    if (!messageText) return;

    let prompt = messageText;
    if (m.isGroup && prefix && prompt.startsWith(prefix)) {
        prompt = prompt.slice(prefix.length).trim();
    }
    if (!prompt || prompt.length > 800) return;

    try { await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } }); } catch {}

    const userNum = m.sender.split('@')[0].split(':')[0];

    let history = [];
    try { history = await getConversationHistory(userNum, 8); } catch {}

    const fullPrompt = history.length
        ? history.map(h => `${h.role === 'user' ? 'User' : 'Bot'}: ${h.message}`).join('\n') + '\nUser: ' + prompt
        : prompt;

    const response = await callAI(fullPrompt);

    if (!response) {
        try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
        return;
    }

    try { await addConversationMessage(userNum, 'user', prompt); } catch {}
    try { await addConversationMessage(userNum, 'assistant', response); } catch {}

    if (response.startsWith('CMD:')) {
        const cmdStr = response.slice(4).trim();
        const [rawName, ...cmdArgs] = cmdStr.split(/\s+/);
        const cmdName = rawName.toLowerCase();
        const resolvedName = aliases[cmdName] || cmdName;
        const target = commands[resolvedName] || commands[cmdName];
        if (target && typeof target === 'function') {
            try {
                await target({ ...context, args: cmdArgs, text: cmdArgs.join(' '), q: cmdArgs.join(' '), body: cmdArgs.join(' ') });
                try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
            } catch (e) {
                console.error('❌ [AUTOAI CMD ERROR]:', e.message);
                try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            }
        } else {
            try { await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } }); } catch {}
            await client.sendMessage(m.chat, { text: `dunno that command 💀` }, { quoted: m });
        }
    } else {
        try { await client.sendMessage(m.chat, { text: response }, { quoted: m }); } catch {}
        try { await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); } catch {}
    }
};
