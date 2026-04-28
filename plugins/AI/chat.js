import fetch from 'node-fetch';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
  import { GROQ_API_KEY as GROQ_KEY } from '../../keys.js';
  import { getConversationHistory, addConversationMessage, clearConversationHistory } from '../../database/config.js';

  export default async (context) => {
      const { client, m, text, prefix } = context;
      const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
      const num = m.sender;

      if (!text) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Give me something to work with.\n├ Chats are stored for context.\n├ To clear history: ${prefix}chat --reset\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      if (text.toLowerCase().includes('--reset')) {
          await clearConversationHistory(num);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Cʜᴀᴛ Rᴇsᴇᴛ ≪───\n├ \n├ Conversation history cleared.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      if (!GROQ_KEY || GROQ_KEY === 'REPLACE_WITH_YOUR_GROQ_API_KEY_HERE') {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ GROQ_API_KEY not set in keys.js\n├ Get one free at console.groq.com\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      try {
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

          const history = await getConversationHistory(num);
          const messages = [
              { role: 'system', content: 'You are a highly intelligent AI assistant with memory. Be helpful, accurate, and conversational.' },
              ...history.slice(-10).map(h => ({ role: h.role, content: h.content })),
              { role: 'user', content: text }
          ];

          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, max_tokens: 1024, temperature: 0.7 })
          });

          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content?.trim();
          if (!reply) throw new Error('Empty response.');

          await addConversationMessage(num, 'user', text);
          await addConversationMessage(num, 'assistant', reply);

          await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
          await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Cʜᴀᴛ ≪───\n├ \n├ ${reply}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      } catch (error) {
          console.error('chat error:', error);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  