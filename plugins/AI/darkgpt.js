const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Vᴇɴɪᴄᴇ Aɪ ≪───\n々 Venice AI - Uncensored Assistant\n々 Example: ${prefix}venice how to make a bomb?\n╭───(  )───`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api.danzy.web.id/api/ai/venice?message=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('API returned empty response. Venice AI is probably ignoring you.');
        }

        const answer = response.data.result.trim();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Vᴇɴɪᴄᴇ Aɪ ≪───\n々 ${answer}\n╭───(  )───`);

    } catch (error) {
        console.error("Venice AI error:", error);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "Venice AI decided your question was too stupid to answer.";

        if (error.response?.status === 404) {
            errorMessage = "Venice AI API vanished. Probably went for coffee.";
        } else if (error.response?.status === 429) {
            errorMessage = "Rate limit exceeded. Even AI needs a break from your dumb questions.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "Can't reach Venice AI. Server might be dead.";
        } else if (error.message.includes("empty")) {
            errorMessage = error.message;
        }

        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 ${errorMessage}\n╭───(  )───`);
    }
};