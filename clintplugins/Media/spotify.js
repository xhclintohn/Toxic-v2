module.exports = async (context) => {
  const { client, m, text, fetchJson } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
  };

  // Check if song name is provided
  if (!text) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Yo, fam, what song you tryna download? 🎶 Ex: .spotifydl Blinding Lights") },
      { quoted: m, ad: true }
    );
  }

  // Limit query length to keep it chill
  if (text.length > 100) {
    return client.sendMessage(
      m.chat,
      { text: formatStylishReply("Keep the song name short, homie! Max 100 chars. 📝") },
      { quoted: m, ad: true }
    );
  }

  try {
    // Fetch song from API
    const data = await fetchJson(`https://api.dreaded.site/api/spotifydl?title=${encodeURIComponent(text)}`);

    if (data.success && data.result?.downloadLink) {
      const audio = data.result.downloadLink;
      const filename = data.result.title || "Unknown Song";

      // Notify user
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`Grabbin’ *${filename}* for ya! Droppin’ it as audio and doc... 🔥`) },
        { quoted: m, ad: true }
      );

      // Send as document
      await client.sendMessage(
        m.chat,
        {
          document: { url: audio },
          mimetype: "audio/mpeg",
          fileName: `${filename}.mp3`,
        },
        { quoted: m, ad: true }
      );

      // Send as audio
      await client.sendMessage(
        m.chat,
        {
          audio: { url: audio },
          mimetype: "audio/mpeg",
          fileName: `${filename}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: filename,
              body: data.result.artist || "Unknown Artist",
              thumbnailUrl: data.result.thumbnail || "",
              sourceUrl: data.result.url || "",
              mediaType: 1,
              renderLargerThumbnail: true,
            },
          },
        },
        { quoted: m, ad: true }
      );
    } else {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("API’s ghostin’ us, no valid song link! 😢 Try another track.") },
        { quoted: m, ad: true }
      );
    }
  } catch (error) {
    console.error("SpotifyDL command error:", error);
    await client.sendMessage(
      m.chat,
      {
        text: formatStylishReply(
          `Couldn’t fetch *${text}*. Try the exact song name or add the artist! 😎`
        ),
      },
      { quoted: m, ad: true }
    );
  }
};