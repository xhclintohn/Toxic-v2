const axios = require('axios');

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Wᴇʙ2Zɪᴩ ≪───\n├ \n├ Downloads entire websites as ZIP files\n├ Example: ${prefix}web2zip https://example.com\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        let url = text.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const apiUrl = `https://api.nexray.web.id/tools/webtozip?url=${encodeURIComponent(url)}`;
        
        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            },
            timeout: 60000
        });

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('API returned empty response. Web2Zip service is probably sleeping.');
        }

        const result = response.data.result;
        
        if (result.error && result.error.text !== '-') {
            throw new Error(`Service error: ${result.error.text}`);
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const caption = `╭───(    TOXIC-MD    )───\n├───≫ Wᴇʙsɪᴛᴇ Zɪᴩ ≪───\n├ \n├ *URL:* ${result.url}\n├ *Files Copied:* ${result.copiedFilesAmount}\n├ *Download Link:*\n├ ${result.downloadUrl}\n├\n├ Click the link above to download the ZIP\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await client.sendMessage(m.chat, { text: caption }, { quoted: m });

    } catch (error) {
        console.error("Web2Zip error:", error.response?.status, error.message);

        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        let errorMessage = "Failed to create website ZIP. The internet hates you today.";

        if (error.response?.status === 400) {
            errorMessage = "Invalid URL. Even the API knows your link is garbage.";
        } else if (error.response?.status === 404) {
            errorMessage = "Website not found. Did you type it with your eyes closed?";
        } else if (error.response?.status === 429) {
            errorMessage = "Rate limit exceeded. Stop spamming, nobody wants that many ZIPs.";
        } else if (error.message.includes("timeout")) {
            errorMessage = "Website took too long to respond. Probably as slow as your brain.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage = "Can't reach the website. Is it even real?";
        }

        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ \n├ ${errorMessage}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};