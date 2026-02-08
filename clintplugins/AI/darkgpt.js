const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 wormgpt - uncensored ai\n> 々 example: ${prefix}wormgpt how to hack a website?\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
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

        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 ${answer}\n> 々 😈\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);

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

        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n> 々 ${errorMessage}\n> 々 𝐓𝐨𝐱𝐢𝐜-𝐌D\n╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───`);
    }
};