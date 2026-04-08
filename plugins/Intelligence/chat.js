const { saveConversation, getRecentMessages } = require('../../database/config');
const { deleteUserHistory } = require('../../database/config'); 

module.exports = async (context) => {
    const { client, m, text, botname, fetchJson, prefix } = context;
    const num = m.sender;

    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Provide some text or query for AI chat.\n├ Your chats with the AI are stored indefinitely to create context.\n├ To delete your chat history send *${prefix}chat --reset*\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    
    if (text.toLowerCase().includes('--reset')) {
        await deleteUserHistory(num);
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Cʜᴀᴛ Rᴇsᴇᴛ ≪───\n├ \n├ Conversation history cleared.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    try {
        await saveConversation(num, 'user', text);

        const recentHistory = await getRecentMessages(num);
        const contextString = recentHistory.map(entry => `${entry.role}: ${entry.message}`).join('\n');

        const queryWithContext = encodeURIComponent(`${contextString}\nuser: ${text.replace('--reset', '').trim()}`);
        const data = await fetchJson(`https://api.dreaded.site/api/aichat?query=${queryWithContext}`);

        const response = data?.result || "I'm not sure how to respond to that.";

        await saveConversation(num, 'bot', response);
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Aɪ Cʜᴀᴛ ≪───\n├ \n├ ${response}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    } catch (error) {
        console.error(error);
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Eʀʀᴏʀ ≪───\n├ \n├ Something went wrong...\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};