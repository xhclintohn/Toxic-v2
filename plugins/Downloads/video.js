import yts from 'yt-search';
import fetch from 'node-fetch';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
    const { client, m, text } = context;
    const fq = getFakeQuoted(m);

    if (!text) return m.reply("╭───(    TOXIC-MD    )───\n├ Give me a video name, it's not rocket science.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
    if (text.length > 100) return m.reply("╭───(    TOXIC-MD    )───\n├ Title longer than your attention span. Under 100 chars!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");

    try {
        await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });
        const searchQuery = `${text} official`;
        const searchResult = await yts(searchQuery);
        const video = searchResult.videos[0];
        if (!video) return m.reply(`╭───(    TOXIC-MD    )───\n├ Nothing found for "${text}". Your taste doesn't exist.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
        const encodedUrl = encodeURIComponent(video.url);
        const response = await fetch(`https://api.ootaizumi.web.id/downloader/youtube?url=${encodedUrl}&format=720`, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", "Accept": "application/json" } });
        const data = await response.json();
        if (!data.status || !data.result || !data.result.download) throw new Error('API returned no valid video data.');
        const title = data.result.title || "Untitled";
        const videoUrl = data.result.download;
        const thumbnailUrl = data.result.thumbnail;
        await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
        await client.sendMessage(m.chat, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            fileName: `${title}.mp4`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "Powered by Toxic-MD",
                    thumbnailUrl,
                    sourceUrl: video.url,
                    mediaType: 2,
                    renderLargerThumbnail: true,
                },
            },
        }, { quoted: fq });
    } catch (error) {
        console.error(`Video error:`, error);
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
        let userMessage = 'Download failed. The universe despises your video choice.';
        if (error.message.includes('API returned')) userMessage = 'The video service rejected the request.';
        await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ VIDEO ERROR ≪───\n├ \n├ ${userMessage}\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
};
