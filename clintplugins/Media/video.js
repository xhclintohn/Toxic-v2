module.exports = {
  name: 'video',
  aliases: ['vid', 'youtube', 'yt'],
  description: 'Searches and downloads a random YouTube video, you lazy fuck',
  run: async (context) => {
    const { client, m, text, botname, fetchJson } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text || text.trim() === '') {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you forgot the search query, you dumb fuck! Example: .video Spectre\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Sanitize query
      const cleanedQuery = text.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '');
      if (cleanedQuery.length < 3) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ What’s this weak-ass query, ${m.pushName}? At least 3 characters, you dumbass! 🙄\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Search YouTube
      const encodedQuery = encodeURIComponent(cleanedQuery);
      const searchData = await fetchJson(`https://api.giftedtech.web.id/api/search/yts?apikey=gifted&query=${encodedQuery}`);

      if (!searchData || !searchData.success || !searchData.results || searchData.results.length === 0) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No videos found for "${cleanedQuery}", you tasteless loser. Try a better query, ${m.pushName}! 😒\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Filter for videos only
      const videos = searchData.results.filter(item => item.type === 'video');
      if (videos.length === 0) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Found shit, but no videos for "${cleanedQuery}". You suck at picking queries, ${m.pushName}! 😒\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Randomly select from up to 5 videos
      const results = videos.slice(0, 5);
      const selectedVideo = results[Math.floor(Math.random() * results.length)];

      // Download the video
      const downloadData = await fetchJson(`https://api.giftedtech.web.id/api/download/dlmp4?apikey=gifted&url=${encodeURIComponent(selectedVideo.url)}`);

      if (!downloadData || !downloadData.success || !downloadData.result || !downloadData.result.download_url) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn’t download the video, ${m.pushName}. API’s being a bitch. Try another query, you sad loser! 😒\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Build result message
      let resultMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ Found ${results.length} videos for "${cleanedQuery}", ${m.pushName}! I randomly picked one, you lucky bastard! 😈\n\n`;
      results.forEach((video, index) => {
        resultMessage += `${index + 1}. *${video.title}*${video.duration ? ` (${video.duration})` : ''}${video.url === selectedVideo.url ? ' [Picked]' : ''}\n`;
      });
      resultMessage += `\n◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

      await m.reply(resultMessage);

      // Send video
      const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your *${downloadData.result.title}*, ${m.pushName}! Don’t bore everyone with this shit! 😈\n` +
                     `📹 *Source*: YouTube\n` +
                     (selectedVideo.duration ? `⏱️ *Duration*: ${selectedVideo.duration}\n` : '') +
                     (downloadData.result.views ? `👀 *Views*: ${downloadData.result.views}\n` : '') +
                     `◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

      await client.sendMessage(m.chat, {
        video: { url: downloadData.result.download_url },
        caption: caption
      }, { quoted: m });

    } catch (error) {
      console.error(`Video command fucked up: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}! Couldn’t get your video for "${text}". API’s trash or you’re cursed. Try later.\n│❒ Check https://github.com/xhclintohn/Toxic-MD for help.\n◈━━━━━━━━━━━━━━━━◈`);
    }
  }
};