const fetch = require('node-fetch');

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ The bot has no name. The developer is clearly as competent as you are.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Where is your prompt? You managed to type the command but forgot the question. Amazing.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api.nexray.web.id/ai/chatgpt?text=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl, { timeout: 10000 });

        if (!response.ok) throw new Error(`Service unavailable: ${response.status}`);

        const data = await response.json();
        if (!data.status || !data.result) throw new Error('The AI returned a blank, useless response.');

        let replyText = data.result;

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Gᴘᴛ Rᴇsᴘᴏɴsᴇ ≪───\n├ \n├ ${replyText}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
        console.error(`GPT error:`, error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        let userMessage = 'The AI service has failed. Surprise.';
        if (error.message.includes('Service unavailable')) userMessage = 'The API is down. Blame their infrastructure, not my competence.';
        if (error.message.includes('blank, useless')) userMessage = 'The AI returned empty text. Try asking a question that makes sense.';
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ ${userMessage}\n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};