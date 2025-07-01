module.exports = async (context) => {
  const { client, m, text, fetchJson } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
  };

  // Check if URL is provided
  if (!text || !text.includes("youtu")) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, gimme a valid YouTube URL, homie! 📹 Ex: .youtube https://youtu.be/60ItHLz5WEA") },
      { quoted: m, ad: true }
    );
  }

  try {
    // Fetch audio and video from API
    const data = await fetchJson(`https://giftedapi.zone.id/api/download/ytdl?apikey=gifted&url=${encodeURIComponent(text)}`);

    if (data.success && data.result?.audio_url && data.result?.video_url) {
      const { result } = data;
      const filename = result.title || "Unknown Media";

      // Notify user
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`Droppin’ *${filename}* as audio and video! Get ready! 🔥🎶`) },
        { quoted: m, ad: true }
      );

      // Send audio
      await client.sendMessage(
        m.chat,
        {
          audio: { url: result.audio_url },
          mimetype: "audio/mpeg",
          fileName: `${filename}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: filename,
              body: `Audio: ${result.audio_quality || "320kbps"} | Duration: ${result.duration || "Unknown"}`,
              thumbnailUrl: result.thumbnail || "",
              sourceUrl: text,
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        },
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
        { text: formatStylishReply("API’s ghostin’, no audio or video link! 😢 Check the URL.") },
        { quoted: m, ad: true }
      );
    }
  } catch (error) {
    console.error("YouTube command error:", error);
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Something’s off: ${error.message}. Try another URL, fam! 😎`) },
      { quoted: m, ad: true }
    );
  }
};