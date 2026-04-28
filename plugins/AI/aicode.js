import fetch from 'node-fetch';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';
  import { GROQ_API_KEY as GROQ_KEY } from '../../keys.js';

  export default async (context) => {
      const { client, m, text, prefix } = context;
      const fq = getFakeQuoted(m);
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

      if (!text) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Provide a language and prompt.\n├ Usage: ${prefix}aicode <language> <prompt>\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const [language, ...promptArr] = text.split(' ');
      const prompt = promptArr.join(' ');

      if (!language || !prompt) {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Missing language or prompt.\n├ Example: ${prefix}aicode python hello world\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
      if (!GROQ_KEY || GROQ_KEY === 'REPLACE_WITH_YOUR_GROQ_API_KEY_HERE') {
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } }).catch(() => {});
          return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ GROQ_API_KEY not set in keys.js\n├ Get one free at console.groq.com\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      try {
          await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  model: 'llama-3.3-70b-versatile',
                  messages: [
                      { role: 'system', content: `You are an expert ${language} programmer. Generate clean, working code with no markdown formatting, no backticks, no explanations — just the raw code. Output ONLY the code itself.` },
                      { role: 'user', content: prompt }
                  ],
                  max_tokens: 1500, temperature: 0.2
              })
          });
          if (!res.ok) throw new Error(`API error: ${res.status}`);
          const data = await res.json();
          const code = data.choices?.[0]?.message?.content?.trim();
          if (!code) throw new Error('No code generated.');
          await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Aɪ Cᴏᴅᴇ ≪───\n├ \n├ Language: ${language}\n├\n${code}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      } catch (error) {
          console.error('aicode error:', error);
          await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
          m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Code generation failed. ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }
  };
  