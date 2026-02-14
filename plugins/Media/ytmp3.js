const fetch = require("node-fetch");
const ytdl = require("ytdl-core");

module.exports = async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) return m.reply("╭───(    TOXIC-MD    )───\n├ Bot is nameless and broken. Blame the dev.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

    if (!text) return m.reply(`╭───(    TOXIC-MD    )───\n├ You forgot the YouTube link, ${m.pushName}.\n├ Can you even follow simple instructions?\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);

    const urls = text.match(/(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?[a-zA-Z0-9_-]{11})/gi);
    if (!urls) return m.reply("╭───(    TOXIC-MD    )───\n├ That's not a valid YouTube link. Learn how URLs work.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

        const encodedUrl = encodeURIComponent(text);
        const response = await fetch(`https://api.sidycoders.xyz/api/ytdl?url=${encodedUrl}&format=mp3&apikey=memberdycoders`, { 
            headers: { 
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", 
                "Accept": "application/json" 
            } 
        });

        const data = await response.json();

        if (!data.status || !data.cdn) {
            throw new Error('API returned no valid audio data.');
        }

        const title = data.title || "Untitled";
        const audioUrl = data.cdn;

        await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

        await client.sendMessage(m.chat, { 
            audio: { url: audioUrl }, 
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title.substring(0, 30),
                    body: "Toxic-MD",
                    thumbnailUrl: "",
                    sourceUrl: text,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                },
            },
        }, { quoted: m });

        await client.sendMessage(m.chat, {
            document: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
            caption: `╭───(    TOXIC-MD    )───\n├───≫ YTMP3 ≪───\n├ \n├ ${title}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: m });

    } catch (error) {
        console.error(`ytmp3 error:`, error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });

        try {
            const info = await ytdl.getInfo(text);
            const format = ytdl.chooseFormat(info.formats, { filter: "audioonly", quality: "highestaudio" });
            const audioUrl = format.url;
            const title = info.videoDetails.title;

            await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            await client.sendMessage(m.chat, { 
                audio: { url: audioUrl }, 
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`
            }, { quoted: m });

        } catch (fallbackError) {
            console.error(`Fallback error: ${fallbackError.message}`);
            await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ YTMP3 ERROR ≪───\n├ \n├ Both download methods failed.\n├ The universe rejects your request.\n├ ${fallbackError.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        }
    }
};