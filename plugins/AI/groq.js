const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Provide a query, you walnut.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    let GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
        try { GROQ_KEY = require('../../keys').GROQ_API_KEY; } catch {}
    }
    if (!GROQ_KEY) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ GROQ_API_KEY not configured. Set it at console.groq.com\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant powered by Groq\'s ultra-fast inference. Answer simply and clearly.' },
                    { role: 'user', content: text }
                ],
                max_tokens: 1024,
                temperature: 0.7
            })
        });

        if (!res.ok) throw new Error(`Groq API error: ${res.status}`);

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        if (!content) throw new Error('No response received.');

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await client.sendMessage(m.chat, { text: `╭───(    TOXIC-MD    )───\n├───≫ Gʀᴏǫ Rᴇsᴘᴏɴsᴇ ≪───\n├ \n├ ${content}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧` }, { quoted: m });

    } catch (error) {
        console.error('Groq error:', error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
