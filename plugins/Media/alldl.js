module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) return m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` Please provide a link to download\n> `»` Example: FB, X, TikTok, Instagram\n╰──────────────────☉");

    try {
        const encodedUrl = encodeURIComponent(text);
        const apiUrl = `https://www.movanest.xyz/v2/social?type=all&query=${encodedUrl}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.results) {
            return m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` Failed to download media\n> `»` Link might be invalid or unsupported\n╰──────────────────☉");
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
            return m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` No downloadable media found\n> `»` Try another link\n╰──────────────────☉");
        }

        const title = result.title || "Media Download";
        const quality = result.quality || "HD";
        
        const caption = `*『 𝚃𝙾𝚇𝙸𝙲-MD 』*

╭───(    \`𝚂𝚢𝚜𝚝𝚎𝚖 𝙸𝚗𝚏𝚘\`    )───
> ───≫ 🔗 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁 ≫ <<───
> \`々\` 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦 : ${platform}
> \`々\` 𝐓𝐢𝐭𝐥𝐞 : ${title}
> \`々\` 𝐐𝐮𝐚𝐥𝐢𝐭𝐲 : ${quality}
> \`々\` 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐝 𝐁𝐲 : ${botname}
╰──────────────────☉`;

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
        m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` An error occurred\n> `»` ${error.message}\n╰──────────────────☉");
    }
};