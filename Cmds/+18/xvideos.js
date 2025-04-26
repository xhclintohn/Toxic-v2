module.exports = async (context) => {
  const { client, m, text, botname, fetchJson } = context;

  if (!text || text.trim() === '') {
    return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, horny moron, give me a search query! Use *!xvideos hot stuff* or fuck off! 😡`);
  }

  try {
    const cleanedQuery = text.trim().slice(0, 50).replace(/[^a-zA-Z0-9\s]/g, '');
    if (cleanedQuery.length < 3) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ What’s this weak-ass query, ${m.pushName}? At least 3 characters, you dumbass! 🙄`);
    }

    const encodedQuery = encodeURIComponent(cleanedQuery);
    const searchData = await fetchJson(`https://api.giftedtech.web.id/api/search/xvideossearch?apikey=gifted&query=${encodedQuery}`);

    if (!searchData || !searchData.success || !searchData.results || searchData.results.length === 0) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ API’s being a bitch, no videos found for "${cleanedQuery}", loser! Try another query. 😒`);
    }

    const results = searchData.results.slice(0, 5);
    const selectedVideo = results[Math.floor(Math.random() * results.length)];

    const downloadData = await fetchJson(`https://api.giftedtech.web.id/api/download/xvideosdl?apikey=gifted&url=${encodeURIComponent(selectedVideo.url)}`);

    if (!downloadData || !downloadData.success || !downloadData.result || !downloadData.result.download_url) {
      return m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Download API fucked up, no video for you, ${m.pushName}! Try another query, you sad perv. 😒`);
    }

    let resultMessage = `◈━━━━━━━━━━━━━━━━◈\n│❒ Found ${results.length} filthy videos for "${cleanedQuery}", ${m.pushName}! I randomly picked this one, you lucky bastard! 😈\n\n`;
    results.forEach((video, index) => {
      resultMessage += `${index + 1}. *${video.title}* (${video.duration})${video.url === selectedVideo.url ? ' [Picked]' : ''}\n`;
    });
    resultMessage += `\n◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

    await m.reply(resultMessage);

    const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ Here’s your nasty *${downloadData.result.title}*, ${m.pushName}! Don’t get caught with this shit! 😈\n` +
                   `📹 *Duration*: ${selectedVideo.duration}\n` +
                   `👀 *Views*: ${downloadData.result.views}\n` +
                   `👍 *Likes*: ${downloadData.result.likes}\n` +
                   `💾 *Size*: ${downloadData.result.size}\n` +
                   `◈━━━━━━━━━━━━━━━━◈\nPowered by *${botname}*`;

    await client.sendMessage(m.chat, { 
      video: { url: downloadData.result.download_url }, 
      caption: caption 
    }, { quoted: m });

  } catch (error) {
    console.error('Xvideo command error:', error);
    await m.reply(`◈━━━━━━━━━━━━━━━━◈\n│❒ Shit hit the fan, ${m.pushName}! Error: ${error.message}. Bug off and try later, you filthy slacker! 😡\nCheck https://github.com/xhclintohn/Toxic-MD for help.`);
  }
};