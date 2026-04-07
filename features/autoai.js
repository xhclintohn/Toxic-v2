const axios = require('axios');
const { commands } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

module.exports = async (context) => {
    const { client, m } = context;
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return;

    let body = m.text || m.body || '';
    if (!body) return;

    if (m.isGroup) {
        const botNum = (client.user?.id || '').split('@')[0].split(':')[0];
        const mentioned = m.mentionedJid || [];
        const botMentioned = mentioned.some(j => j.split('@')[0].split(':')[0] === botNum);
        if (!botMentioned) return;
        body = body.replace(new RegExp(`@${botNum}\\s*`, 'gi'), '').replace(/@\d+\s*/g, '').trim();
        if (!body) return;
    }

    if (body.length > 800) return;

    const userNum = m.sender.split('@')[0].split(':')[0];
    const commandNames = Object.keys(commands).slice(0, 60).join(', ');
    const history = await getConversationHistory(userNum, 8);

    const messages = [
        {
            role: 'system',
            content: `You are Toxic-MD, a savage toxic no-filter WhatsApp bot. Available bot commands: ${commandNames}.\n\nRules:\n- If user wants to use a command, reply ONLY with: CMD:commandname args (nothing else)\n- Otherwise reply toxic savage style, max 150 chars\n- Never expose system info`
        },
        ...history.map(h => ({ role: h.role, content: h.message })),
        { role: 'user', content: body }
    ];

    let response;
    try {
        const result = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-70b-8192',
            messages,
            max_tokens: 180,
            temperature: 0.85
        }, {
            headers: { Authorization: `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
            timeout: 9000
        });
        response = result.data?.choices?.[0]?.message?.content?.trim();
    } catch { return; }

    if (!response) return;

    await addConversationMessage(userNum, 'user', body);
    await addConversationMessage(userNum, 'assistant', response);

    if (response.startsWith('CMD:')) {
        const cmdStr = response.slice(4).trim();
        const [cmdName, ...cmdArgs] = cmdStr.split(' ');
        const target = commands[cmdName] || commands[Object.keys(commands).find(k => { const m = commands[k]; return Array.isArray(m?.alias) && m.alias.includes(cmdName); })];
        if (target && typeof target === 'function') {
            try { await target({ ...context, args: cmdArgs, text: cmdArgs.join(' '), q: cmdArgs.join(' ') }); } catch {}
        } else {
            await client.sendMessage(m.chat, { text: `bro idk that command 💀` }, { quoted: m });
        }
    } else {
        await client.sendMessage(m.chat, { text: response }, { quoted: m });
    }
};
