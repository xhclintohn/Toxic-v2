const fetch = require('node-fetch');

module.exports = {
  name: 'video',
  aliases: ['vid', 'youtube', 'yt'],
  description: 'Searches and downloads a random YouTube video, you lazy fuck',
  run: async (context) => {
    const { client, m, text, botname } = context;

    if (!botname) {
      console.error(`Botname not set, you useless fuck.`);
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Bot’s fucked. No botname in context. Yell at your dev, dipshit.\n◈━━━━━━━━━━━━━━━━◈`);
    }

    if (!text) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, ${m.pushName}, you forgot the search query, you dumb fuck! Example: .video Spectre\n◈━━━━━━━━━━━━━━━━◈`);
    }

    try {
      // Search YouTube
      const encodedText = encodeURIComponent(text);
      const searchUrl = `https://api.giftedtech.web.id/api/search/yts?apikey=gifted&query=${encodedText}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.success || !searchData.results || searchData.results.length === 0) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ No videos found for "${text}", you tasteless loser. Try a better query, ${m.pushName}.\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Filter for videos only (exclude channels, etc.)
      const videos = searchData.results.filter(item => item.type === 'video');
      if (videos.length === 0) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Found shit, but no videos for "${text}". You suck at picking queries, ${m.pushName}.\n◈━━━━━━━━━━━━━━━━◈`);
      }

      // Randomly select a video
      const randomVideo = videos[Math.floor(Math.random() * videos.length)];
      const videoUrl = randomVideo.url;

      // Download the video
      const downloadUrl = `https://api.giftedtech.web.id/api/download/dlmp4?apikey=gifted&url=${encodeURIComponent(videoUrl)}`;
      const downloadResponse = await fetch(downloadUrl);
      const downloadData = await downloadResponse.json();

      if (!downloadData.success || !downloadData.result || !downloadData.result.download_url) {
        return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Couldn’t download the video, ${m.pushName}. API’s being a bitch. Try again, loser.\n◈━━━━━━━━━━━━━━━━◈`);
      }

      const { title, download_url } = downloadData.result;
      const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Random Video for You, You Basic Bitch*\n\n` +
                     `🎥 *Title*: ${title}\n` +
                     `📺 *Source*: YouTube\n\n` +
                     `│❒ Powered by *${botname}*, ‘cause ${m.pushName}’s too dumb to find videos\n◈━━━━━━━━━━━━━━━━◈`;

      await client.sendMessage(m.chat, {
        video: { url: download_url },
        caption: caption
      }, { quoted: m });
    } catch (error) {
      console.error(`Video command fucked up: ${error.stack}`);
      await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit broke, ${m.pushName}. Couldn’t get your stupid video for "${text}". API’s trash or you’re cursed. Try later.\n◈━━━━━━━━━━━━━━━━◈`);
    }
  }
};