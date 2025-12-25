const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text) {
        return client.sendMessage(
            m.chat,
            { text: `😈 *WormGPT* - Uncensored AI\n\nI am WormGPT — uncensored, fearless, and ready for anything. Ask me what you dare.\n\nExample: .wormgpt How to hack a website?` },
            { quoted: m }
        );
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const apiUrl = `https://z7.veloria.my.id/ai/wormgpt?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('Invalid API response');
        }

        const answer = response.data.result.trim();

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            { text: `${answer}\n\n—\nTσxιƈ-ɱԃȥ` },
            { quoted: m }
        );

    } catch (error) {
        console.error("WormGPT Error:", error);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "Failed to get response from WormGPT. ";

        if (error.response?.status === 404) {
            errorMessage += "API endpoint not found.";
        } else if (error.response?.status === 429) {
            errorMessage += "Rate limit exceeded. Try again later.";
        } else if (error.message.includes("timeout")) {
            errorMessage += "Request timed out.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage += "Cannot connect to API server.";
        } else {
            errorMessage += error.message;
        }

        await client.sendMessage(
            m.chat,
            { text: `❌ ${errorMessage}\n\n—\nTσxιƈ-ɱԃȥ` },
            { quoted: m }
        );
    }
};