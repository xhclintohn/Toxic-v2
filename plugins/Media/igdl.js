const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) return m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Mɪssɪɴɢ Uʀʟ ≪───\n々 Give me an Instagram link, you social media addict.\n╭───( ✓ )───");
        if (!text.includes("instagram.com")) return m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n々 That's not an Instagram link. Are your eyes broken?\n╭───( ✓ )───");

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://api.danzy.web.id/api/download/instagram?url=${encodedUrl}`);
        const data = await response.json();

        if (!data?.status || !data?.result?.url) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 Instagram download failed.\n々 The post is probably private or\n々 your link is garbage.\n╭───( ✓ )───");
        }

        const videoUrl = data.result.url;
        const type = data.result.type || 'video';

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const caption = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Iɴsᴛᴀɢʀᴀᴍ Dᴏᴡɴʟᴏᴀᴅ ≪───\n々 Type: ${type}\n々 Stop wasting my time with\n々 your basic reel downloads.\n╭───( ✓ )───`;

        if (type === 'video') {
            await client.sendMessage(m.chat, {
                video: { url: videoUrl },
                mimetype: "video/mp4",
                caption: caption,
                gifPlayback: false,
            }, { quoted: m });
        } else {
            await client.sendMessage(m.chat, {
                image: { url: videoUrl },
                caption: caption,
            }, { quoted: m });
        }

    } catch (error) {
        console.error("Instagram error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n───≫ Fᴀɪʟᴇᴅ ≪───\n々 Instagram download failed.\n々 Your link is as worthless as you are.\n々 Error: ${error.message}\n╭───( ✓ )───`);
    }
};