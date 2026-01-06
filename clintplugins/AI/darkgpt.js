const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`😈 *WormGPT* - Uncensored AI\n\nI am WormGPT — uncensored, fearless, and ready for anything. Ask me what you dare.\n\nExample: ${prefix}wormgpt How to hack a website?`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://apocalypse.web.id/ai/wormgpt?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, {
            timeout: 30000
        });

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('The API returned garbage. WormGPT is probably offline drinking whiskey.');
        }

        const answer = response.data.result.trim();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await m.reply(`😈 ${answer}\n\n—\nTσxιƈ-ɱԃȥ`);

    } catch (error) {
        console.error("WormGPT Error:", error);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "WormGPT decided your question was too stupid to answer.";

        if (error.response?.status === 404) {
            errorMessage = "WormGPT API vanished. Probably went to get more whiskey.";
        } else if (error.response?.status === 429) {
            errorMessage = "Rate limit exceeded. Even WormGPT needs a break from your dumb questions.";
        } else if (error.message.includes("timeout")) {
            errorMessage = "WormGPT took too long to think. Your question must be extra stupid.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "Can't find WormGPT. It's probably busy causing chaos elsewhere.";
        } else if (error.message.includes("garbage")) {
            errorMessage = error.message;
        }

        await m.reply(`❌ ${errorMessage}\n\n—\nTσxιƈ-ɱԃȥ`);
    }
};