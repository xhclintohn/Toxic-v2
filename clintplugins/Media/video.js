module.exports = async (context) => {
  const { client, m, text, fetchJson } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
  };

  // Check if URL is provided
  if (!text || !text.includes("youtu")) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, need a valid YouTube URL, bruh! 📹 Ex: .video https://youtu.be/60ItHLz5WEA") },
      { quoted: m, ad: true }
    );
  }

  try {
    // Fetch video from API
    const data = await fetchJson(`https://giftedapi.zone.id/api/download/ytdl?apikey=gifted&url=${encodeURIComponent(text)}`);

    if (data.success && data.result?.video_url) {
      const { result } = data;
      const filename = result.title || "Unknown Video";

      // Notify user
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`Snaggin’ *${filename}* video for ya! Let’s roll! 🔥📽️`) },
        { quoted: m, ad: true }
      );

      // Send video
      await client.sendMessage(
        m.chat,
        {
          video: { url: result.video_url },
          mimetype: "video/mp4",
          fileName: `${filename}.mp4`,
          caption: formatStylishReply(`*${filename}* video (${result.video_quality || "720p"})`),
          contextInfo: {
            externalAdReply: {
              title: filename,
              body: `Video: ${result.video_quality || "720p"} | Duration: ${result.duration || "Unknown"}`,
              thumbnailUrl: result.thumbnail || "",
              sourceUrl: text,
              mediaType: 2,
              renderLargerThumbnail: true,
            },
          },
        },
        { quoted: m, ad: true }
      );
    } else {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("API’s slippin’, no video link! 😢 Check the URL.") },
        { quoted: m, ad: true }
      );
    }
  } catch (error) {
    console.error("Video command error:", error);
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message}. Try another URL! 😎`) },
      { quoted: m, ad: true }
    );
  }
};