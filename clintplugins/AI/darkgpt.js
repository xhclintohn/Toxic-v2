const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ wormgpt - uncensored ai\n│❒ example: ${prefix}wormgpt how to hack a website?\n◈━━━━━━━━━━━━━━━◈`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://api.danzy.web.id/api/ai/wormgpt?q=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl);

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('the api returned garbage. wormgpt is probably offline drinking whiskey.');
        }

        const answer = response.data.result.trim();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ ${answer}\n│❒ tσxιƈ-ɱԃȥ\n◈━━━━━━━━━━━━━━━◈`);

    } catch (error) {
        console.error("wormgpt error:", error);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "wormgpt decided your question was too stupid to answer.";

        if (error.response?.status === 404) {
            errorMessage = "wormgpt api vanished. probably went to get more whiskey.";
        } else if (error.response?.status === 429) {
            errorMessage = "rate limit exceeded. even wormgpt needs a break from your dumb questions.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "can't find wormgpt. it's probably busy causing chaos elsewhere.";
        } else if (error.message.includes("garbage")) {
            errorMessage = error.message;
        }

        await m.reply(`◈━━━━━━━━━━━━━━━◈\n│❒ ${errorMessage}\n│❒ tσxιƈ-ɱԃȥ\n◈━━━━━━━━━━━━━━━◈`);
    }
};