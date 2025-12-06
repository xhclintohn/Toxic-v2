const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text } = context;

    const formatStylishReply = (message) => {
        return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
    };

    if (!text) {
        return client.sendMessage(
            m.chat,
            { text: formatStylishReply("😈 *WormGPT* - Uncensored AI\n\nI am WormGPT — uncensored, fearless, and ready for anything. Ask me what you dare.\n\n*Example:* .wormgpt How to hack a website?") },
            { quoted: m, ad: true }
        );
    }

    try {
        // Send loading reaction
        await client.sendMessage(m.chat, {
            react: { text: '⌛', key: m.key }
        });

        // Encode the prompt
        const encodedPrompt = encodeURIComponent(text);
        const apiUrl = `https://api.fikmydomainsz.xyz/openai/wormgpt?prompt=${encodedPrompt}`;
        
        console.log("Calling WormGPT API:", apiUrl);

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
            },
            timeout: 30000,
        });

        const data = response.data;

        // Check response
        if (!data?.status || !data?.result) {
            throw new Error('API returned invalid response');
        }

        const answer = data.result.trim();

        // Send success reaction
        await client.sendMessage(m.chat, {
            react: { text: '✅', key: m.key }
        });

        // Send the response
        await client.sendMessage(
            m.chat,
            { text: formatStylishReply(answer) },
            { quoted: m, ad: true }
        );

    } catch (error) {
        console.error("WormGPT Error:", error);

        // Send error reaction
        await client.sendMessage(m.chat, {
            react: { text: '❌', key: m.key }
        });

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
            { text: formatStylishReply(`❌ ${errorMessage}`) },
            { quoted: m, ad: true }
        );
    }
};