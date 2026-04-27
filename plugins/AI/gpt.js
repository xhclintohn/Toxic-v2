import fetch from 'node-fetch';
import { GROQ_API_KEY as GROQ_KEY } from '../../keys.js';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    const { client, m, text } = context;
    const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Type a prompt, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    if (!GROQ_KEY || GROQ_KEY === 'REPLACE_WITH_YOUR_GROQ_API_KEY_HERE') return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ GROQ_API_KEY not set in keys.js\n├ Get one free at console.groq.com\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a highly capable AI assistant. Answer accurately and concisely.' },
                    { role: 'user', content: text }
                ],
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        if (!reply) throw new Error('Empty response from AI.');

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Gᴘᴛ Rᴇsᴘᴏɴsᴇ ≪───\n├ \n├ ${reply}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
        console.error('GPT error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ AI choked. Classic.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
