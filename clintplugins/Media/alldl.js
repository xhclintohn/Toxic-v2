module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!text) return m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` Please provide a link to download\n> `»` Example: FB, X, TikTok, Instagram\n╰──────────────────☉");

    try {
        const apiUrl = `https://api.deline.web.id/downloader/aio?url=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.status || !data.result) {
            return m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` Failed to download media\n> `»` Link might be invalid or private\n╰──────────────────☉");
        }

        const result = data.result;
        
        let mediaUrl = null;
        let isImage = false;
        
        if (result.links?.video) {
            const videoKeys = Object.keys(result.links.video);
            if (videoKeys.length > 0) {
                const bestQuality = videoKeys.find(key => key.includes("HD") || key.includes("video")) || videoKeys[0];
                mediaUrl = result.links.video[bestQuality]?.url;
            }
        } else if (result.links?.image) {
            const imageKeys = Object.keys(result.links.image);
            if (imageKeys.length > 0) {
                mediaUrl = result.links.image[imageKeys[0]]?.url;
                isImage = true;
            }
        }

        if (!mediaUrl) {
            return m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` No downloadable media found\n> `»` Try another link\n╰──────────────────☉");
        }

        const fullMediaUrl = mediaUrl.startsWith('http') ? mediaUrl : `https://dl1.dldldldlllddlll.shop/images/?file=${mediaUrl}`;
        
        const platformName = result.extractor ? result.extractor.replace('-', ' ').toUpperCase() : "UNKNOWN";
        
        const caption = `*『 𝚃𝙾𝚇𝙸𝙲-MD 』*

╭───(    \`𝚂𝚢𝚜𝚝𝚎𝚖 𝙸𝚗𝚏𝚘\`    )───
> ───≫ 🔗 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝚁 ≫ <<───
> \`々\` 𝐏𝐥𝐚𝐭𝐟𝐨𝐫𝐦 : ${platformName}
> \`々\` 𝐓𝐢𝐭𝐥𝐞 : ${result.title || "No title"}
> \`々\` 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐞𝐝 𝐁𝐲 : ${botname}
╰──────────────────☉`;

        if (isImage) {
            await client.sendMessage(m.chat, {
                image: { url: fullMediaUrl },
                caption: caption
            }, { quoted: m });
        } else {
            await client.sendMessage(m.chat, {
                video: { url: fullMediaUrl },
                caption: caption,
                gifPlayback: false
            }, { quoted: m });
        }

    } catch (error) {
        console.error('AllDL Error:', error);
        m.reply("*『 𝚃𝙾𝚇𝙸𝙲-MD 』*\n\n╭───( `𝙴𝚛𝚛𝚘𝚛` )───\n> `»` An error occurred\n> `»` ${error.message}\n╰──────────────────☉");
    }
};