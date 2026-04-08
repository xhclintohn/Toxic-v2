const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text, prefix } = context;

    if (!text) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├ Where's the Facebook link, you brainless moron?\n├ Example: ${prefix}facebook https://www.facebook.com/reel/xxxxx\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    if (!text.includes("facebook.com")) {
        return m.reply("╭───(    TOXIC-MD    )───\n├ That's not a Facebook link, you absolute potato!\n├ Facebook links contain 'facebook.com', duh.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text.trim());
        const apiUrl = `https://vinztyty.my.id/download/facebook?url=${encodedUrl}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.result || data.result.length === 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("╭───(    TOXIC-MD    )───\n├ No video found or API failed. Try another link!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const videos = data.result;
        let video720p = null;
        let bestVideo = null;

        for (const video of videos) {
            if (video.quality && video.quality.includes("720p") && video.url && video.url !== "/") {
                video720p = video;
                break;
            }
            if (video.url && video.url !== "/" && !bestVideo) {
                bestVideo = video;
            }
        }

        const videoToUse = video720p || bestVideo;

        if (!videoToUse || !videoToUse.url || videoToUse.url === "/") {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply("╭───(    TOXIC-MD    )───\n├ Failed to get a valid video URL.\n├ Link might be private or restricted, genius.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(
            m.chat,
            {
                video: { url: videoToUse.url },
                caption: `╭───(    TOXIC-MD    )───\n├───≫ FACEBOOK DL ≪───\n├ \n├ Quality: ${videoToUse.quality || "best available"}\n├ Don't waste my time with more garbage.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
                gifPlayback: false
            },
            { quoted: m }
        );

    } catch (e) {
        console.error("Facebook DL Error:", e);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ FB DL ERROR ≪───\n├ \n├ Download crashed harder than your IQ.\n├ ${e.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
