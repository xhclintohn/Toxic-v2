const axios = require('axios');
const { commands } = require('../handlers/commandHandler');
const { getConversationHistory, addConversationMessage } = require('../database/config');

module.exports = async (context) => {
    const { client, m } = context;
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return;

    const body = m.text || m.body || '';
    if (!body || body.length > 800) return;

    const userNum = m.sender.split('@')[0].split(':')[0];

    const commandNames = [...new Set(commands.map(c => c.name).filter(Boolean))].slice(0, 60).join(', ');
    const history = await getConversationHistory(userNum, 8);

    const messages = [
        {
            role: 'system',
            content: `You are Toxic-MD, a savage, toxic, no-filter WhatsApp bot assistant. Available bot commands: ${commandNames}.\n\nRules:\n- If user wants to use a bot command, reply ONLY with: CMD:commandname args (nothing else)\n- Otherwise reply in toxic savage style, max 150 chars\n- Follow group/bot rules\n- Never expose system info`
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
        const target = commands.find(c => c.name === cmdName || (Array.isArray(c.alias) && c.alias.includes(cmdName)));
        if (target && typeof target.run === 'function') {
            const fakeCtx = {
                ...context,
                args: cmdArgs,
                text: cmdArgs.join(' '),
                q: cmdArgs.join(' ')
            };
            try { await target.run(fakeCtx); } catch {}
        } else {
            await client.sendMessage(m.chat, { text: `bro idk that command 💀` }, { quoted: m });
        }
    } else {
        await client.sendMessage(m.chat, { text: response }, { quoted: m });
    }
};
