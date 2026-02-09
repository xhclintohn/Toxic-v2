module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) return m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Please provide a link to download\n々 Example: FB, X, TikTok, Instagram\n╭───( ✓ )───");

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://www.movanest.xyz/v2/social?type=all&query=${encodedUrl}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.results) {
            return m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 Failed to download media\n々 Link might be invalid or unsupported\n╭───( ✓ )───");
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
            return m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 No downloadable media found\n々 Try another link\n╭───( ✓ )───");
        }

        const title = result.title || "Media Download";
        const quality = result.quality || "HD";
        
        const caption = `╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───
───≫ Downloader ≪───
々 Platform : ${platform}
々 Title : ${title}
々 Quality : ${quality}
々 Downloaded By : ${botname}
╭───( ✓ )───`;

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
        m.reply("╭───( 𝐓𝐨𝐱𝐢𝐜-𝐌D )───\n々 An error occurred\n々 " + error.message + "\n╭───( ✓ )───");
    }
};
