module.exports = {
  name: 'play',
  aliases: ['ply', 'playy', 'pl'],
  description: 'Downloads songs from YouTube and sends audio',
  run: async (context) => {
    const { client, m, text } = context;

    try {
      const query = text ? text.trim() : '';

      if (!query) {
        return m.reply(`╭───(    TOXIC-MD    )───\n├ You forgot to type something, genius.\n├ Give me a song name OR a YouTube link.\n├ Example: .play funk universo\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      if (query.length > 100) {
        return m.reply("╭───(    TOXIC-MD    )───\n├ Song title longer than my patience. 100 chars MAX!\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
      }

      const response = await fetch(`https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (!data.status || !data.result?.download_url) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`╭───(    TOXIC-MD    )───\n├ No song found for "${query}".\n├ Your music taste is as bad as your search skills.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
      }

      const result = data.result;
      const audioUrl = result.download_url;
      const filename = result.title || "Unknown Song";
      const thumbnail = result.thumbnail || "";
      const sourceUrl = result.url || "";
      const duration = result.duration || "";
      const views = result.views || "";
      const channel = result.channel || "";

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      await client.sendMessage(m.chat, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${filename}.mp3`,
        contextInfo: thumbnail ? {
          externalAdReply: {
            title: filename.substring(0, 30),
            body: `Toxic-MD • ${duration} • ${views} views`,
            thumbnailUrl: thumbnail,
            sourceUrl: sourceUrl,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        } : undefined,
      }, { quoted: m });

      await client.sendMessage(m.chat, {
        document: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${filename.replace(/[<>:"/\\|?*]/g, '_')}.mp3`,
        caption: `╭───(    TOXIC-MD    )───\n├───≫ PLAY ≪───\n├ \n├ *${filename}*\n├ ⏱️ ${duration} | Views ${views} | 📺 ${channel}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
      }, { quoted: m });

    } catch (error) {
      console.error('Play error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await m.reply(`╭───(    TOXIC-MD    )───\n├───≫ PLAY ERROR ≪───\n├ \n├ Play failed. The universe rejects your music taste.\n├ ${error.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }
  }
};