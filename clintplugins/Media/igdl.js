const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) return m.reply("Give me an Instagram link, you social media addict.");
        if (!text.includes("instagram.com")) return m.reply("That's not an Instagram link. Are your eyes broken?");

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://api.gimita.id/api/downloader/instagram?url=${encodedUrl}`, {
            method: "GET",
            headers: {
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo4LCJ1c2VybmFtZSI6InhoX2NsaW50b24iLCJyb2xlIjoidXNlciIsInN1YnNjcmlwdGlvbl90aWVyIjoiZnJlZSIsImlzcyI6ImdpbWl0YS1hcGkiLCJleHAiOjE3Njk2ODY2NTIsImlhdCI6MTc2OTY4NTc1Mn0.OgVHy66TFuGO_sh3UlKBXAg_NegR-_w3_0rWrJ275Cw"
            }
        });
        const data = await response.json();

        if (!data?.success || !data?.data?.[0]) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("Instagram download failed. The post is probably private or your link is garbage.");
        }

        const igVideoUrl = data.data[0];

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const caption = `◈━━━━━━━━━━━━━━━◈\n│❒ instagram download ✅\n│❒ tσxιƈ-ɱԃȥ\n◈━━━━━━━━━━━━━━━◈`;

        await client.sendMessage(m.chat, {
            video: { url: igVideoUrl },
            mimetype: "video/mp4",
            caption: caption,
            gifPlayback: false,
        }, { quoted: m });

    } catch (error) {
        console.error("Instagram error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`Instagram download failed. Your link is probably as worthless as you are.\nError: ${error.message}`);
    }
};