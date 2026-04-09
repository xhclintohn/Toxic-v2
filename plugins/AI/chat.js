const fetch = require('node-fetch');
const { getConversationHistory, addConversationMessage, clearConversationHistory } = require('../../database/config');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;
    const num = m.sender;

    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Give me something to work with.\n├ Chats are stored for context.\n├ To clear history: ${prefix}chat --reset\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    if (text.toLowerCase().includes('--reset')) {
        await clearConversationHistory(num);
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Cʜᴀᴛ Rᴇsᴇᴛ ≪───\n├ \n├ Conversation history cleared.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    let GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
        try { GROQ_KEY = require('../../keys').GROQ_API_KEY; } catch {}
    }
    if (!GROQ_KEY) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ GROQ_API_KEY not set. Get one free at console.groq.com\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    try {
        await addConversationMessage(num, 'user', text);

        const recentHistory = await getConversationHistory(num, 12);
        const historyMessages = recentHistory.slice(-12).reverse().map(entry => ({
            role: entry.role === 'bot' ? 'assistant' : 'user',
            content: String(entry.message)
        }));

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are TOXIC-MD, a smart and slightly savage AI assistant. Keep responses concise and accurate.' },
                    ...historyMessages,
                    { role: 'user', content: text.replace('--reset', '').trim() }
                ],
                max_tokens: 512,
                temperature: 0.7
            })
        });

        if (!res.ok) throw new Error(`Groq API error: ${res.status}`);

        const data = await res.json();
        const response = data.choices?.[0]?.message?.content?.trim() || "I'm not sure how to respond to that.";

        await addConversationMessage(num, 'assistant', response);
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Aɪ Cʜᴀᴛ ≪───\n├ \n├ ${response}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
        console.error('chat.js error:', error);
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
