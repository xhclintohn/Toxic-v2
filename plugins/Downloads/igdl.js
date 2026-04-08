const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    try {
        if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Mɪssɪɴɢ Uʀʟ ≪───\n├ Give me an Instagram link, you social media addict.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        if (!text.includes("instagram.com")) return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Iɴᴠᴀʟɪᴅ Uʀʟ ≪───\n├ That's not an Instagram link. Are your eyes broken?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://mkzstyleee.vercel.app/download/instagram?url=${encodedUrl}&apikey=FREE-OKBCJB3N-Q9TC`);
        const data = await response.json();

        if (!data?.status || !data?.result || !data?.result[0]?.url_download) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Instagram download failed.\n├ The post is probably private or\n├ your link is garbage.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const videoUrl = data.result[0].url_download;
        const thumbnail = data.result[0].thumbnail || "";

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        const caption = `╭───(    TOXIC-MD    )───\n├───≫ Iɴsᴛᴀɢʀᴀᴍ Dᴏᴡɴʟᴏᴀᴅ ≪───\n├ Type: Video\n├ Stop wasting my time with\n├ your basic reel downloads.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        await client.sendMessage(m.chat, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: caption,
            gifPlayback: false,
        }, { quoted: m });

    } catch (error) {
        console.error("Instagram error:", error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ Fᴀɪʟᴇᴅ ≪───\n├ Instagram download failed.\n├ Your link is as worthless as you are.\n├ Error: ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};