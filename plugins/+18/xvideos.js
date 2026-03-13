const fetch = require("node-fetch");

module.exports = async (context) => {
    const { client, m, text } = context;

    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ You dumb fuck, type something.\n├ I'm not psychic.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    if (text.length > 150) return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Your search is longer than your dick.\n├ Keep it under 150 chars, idiot.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const searchQuery = encodeURIComponent(text.trim());
        const searchResponse = await fetch(`https://api.nekolabs.web.id/discovery/xvideos/search?q=${searchQuery}`);
        const searchData = await searchResponse.json();

        if (!searchData.success || !searchData.result || searchData.result.length === 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Couldn't find shit for "${text}".\n├ Try better keywords, retard.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        const firstVideo = searchData.result[0];
        const videoPageUrl = firstVideo.url;
        const videoTitle = firstVideo.title || "Some Crappy Clip";
        const duration = firstVideo.duration || "??";
        const cleanTitle = `\( {videoTitle.replace(/[^a-zA-Z0-9]/g, "_")}__ \){duration.replace(/[^a-zA-Z0-9]/g, "")}`;

        const encodedVideoUrl = encodeURIComponent(videoPageUrl);
        const downloadResponse = await fetch(`https://api.nekolabs.web.id/downloader/xvideos?url=${encodedVideoUrl}`);
        const downloadData = await downloadResponse.json();

        if (!downloadData.success || !downloadData.result || !downloadData.result.videos) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ Found it but can't download.\n├ Site's being a bitch again.\n├ Deal with it.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        let videoDownloadUrl = downloadData.result.videos.high || downloadData.result.videos.low;
        if (!videoDownloadUrl) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            return m.reply(`╭───(    TOXIC-MD    )───\n├ \n├ No proper MP4 link.\n├ Only shitty HLS. Cry about it.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, {
            video: { url: videoDownloadUrl },
            mimetype: "video/mp4",
            fileName: `${cleanTitle}.mp4`,
            caption: `╭───(    TOXIC-MD    )───\n├───≫ XVIDEOS ≪───\n├ \n├ *${videoTitle}*\n├ Duration: ${duration}\n├ \n├ Go jerk off somewhere else.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
            contextInfo: {
                externalAdReply: {
                    title: videoTitle.length > 80 ? videoTitle.substring(0, 77) + "..." : videoTitle,
                    body: "Suck it up",
                    thumbnailUrl: downloadData.result.thumb || firstVideo.cover,
                    sourceUrl: videoPageUrl,
                    mediaType: 2,
                    renderLargerThumbnail: true,
                },
            },
        }, { quoted: m });

    } catch (error) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        m.reply(`╭───(    TOXIC-MD    )───\n├───≫ ERROR ≪───\n├ \n├ Everything broke because\n├ you're cursed. Fix your life.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
