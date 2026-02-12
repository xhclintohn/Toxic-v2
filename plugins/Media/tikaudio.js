const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, fetchJson } = context;

    const fetchTikTokData = async (url, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
            const data = await fetchJson(url);
            if (
                data &&
                data.status === 200 &&
                data.tiktok &&
                data.tiktok.music
            ) {
                return data;
            }
        }
        throw new Error("Failed to fetch valid TikTok data after multiple attempts.");
    };

    try {
        if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ Provide a TikTok link, you clueless fool!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        if (!text.includes("tiktok.com")) return m.reply("╭───(    TOXIC-MD    )───\n├ That's not a valid TikTok link, idiot.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

        const url = `https://api.dreaded.site/api/tiktok?url=${text}`;
        const data = await fetchTikTokData(url);

        const tikAudioUrl = data.tiktok.music;

        m.reply("╭───(    TOXIC-MD    )───\n├ TikTok audio fetched! Sending now...\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

        const response = await fetch(tikAudioUrl);

        if (!response.ok) {
            throw new Error(`Failed to download audio: HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        await client.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: false,
        }, { quoted: m });

    } catch (error) {
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ TIKTOK ERROR ≪───\n├ \n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
