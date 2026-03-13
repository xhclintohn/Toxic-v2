module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ Please provide a link to download\n├ Example: FB, X, TikTok, Instagram\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://www.movanest.xyz/v2/social?type=all&query=${encodedUrl}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.results) {
            return m.reply("╭───(    TOXIC-MD    )───\n├ Failed to download media\n├ Link might be invalid or unsupported\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const result = data.results;
        let mediaUrl = null;
        let isImage = false;
        let platform = "Social Media";

        if (result.media && result.media.length > 0) {
            const media = result.media[0];
            mediaUrl = media.url;
            isImage = media.type === 'photo';
        } else if (result.download) {
            mediaUrl = result.download;
        } else if (result.videoUrl) {
            mediaUrl = result.videoUrl;
        }

        if (!mediaUrl) {
            return m.reply("╭───(    TOXIC-MD    )───\n├ No downloadable media found\n├ Try another link\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
        }

        const title = result.title || "Media Download";
        const quality = result.quality || "HD";
        
        const caption = `╭───(    TOXIC-MD    )───
├───≫ Downloader ≪───
├ Platform : ${platform}
├ Title : ${title}
├ Quality : ${quality}
├ Downloaded By : ${botname}
╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

        if (isImage) {
            await client.sendMessage(m.chat, {
                image: { url: mediaUrl },
                caption: caption
            }, { quoted: m });
        } else {
            await client.sendMessage(m.chat, {
                video: { url: mediaUrl },
                caption: caption,
                gifPlayback: false
            }, { quoted: m });
        }

    } catch (error) {
        console.error('AllDL Error:', error);
        m.reply("╭───(    TOXIC-MD    )───\n├ An error occurred\n├ " + error.message + "\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    }
};
