module.exports = {
  name: 'spotify',
  aliases: ['spotifydl', 'spoti', 'spt'],
  description: 'Downloads songs from Spotify',
  run: async (context) => {
    const { client, m, prefix, botname, fetchJson } = context;

    const formatStylishReply = (message) => {
      return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
    };

    const query = m.body.replace(new RegExp(`^${prefix}(spotify|spotifydl|spoti|spt)\\s*`, 'i'), '').trim();

    if (!query) {
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 What song you tryna download? 🎶\n│❒ Example: ${prefix}spotify Alone Pt II\n│❒ Or: ${prefix}spoti Alan Walker Ava Max\n◈━━━━━━━━━━━━━━━━◈`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    if (query.length > 100) {
      return client.sendMessage(m.chat, {
        text: formatStylishReply("Bruh, that song name’s too long 😤 — keep it under 100 chars!")
      }, { quoted: m });
    }

    try {
      // Realistic cranky loading message
      const loadingMsg = await client.sendMessage(m.chat, {
        text: formatStylishReply(`Alright, gimme a sec... I'm digging through Spotify for "${query}" 🎧\nThis might take a bit, don’t rush me 😤`)
      }, { quoted: m });

      const apiUrl = `https://api.ootaizumi.web.id/downloader/spotifyplay?query=${encodeURIComponent(query)}`;
      const data = await fetchJson(apiUrl);

      if (data.status && data.result?.download) {
        const song = data.result;
        const audioUrl = song.download;
        const filename = song.title || "Unknown Song";
        const artist = song.artists || "Unknown Artist";
        const album = song.album || "Unknown Album";
        const duration = song.duration_ms
          ? `${Math.floor(song.duration_ms / 60000)}:${((song.duration_ms % 60000) / 1000)
              .toFixed(0)
              .padStart(2, '0')}`
          : "Unknown";

        // Delete loading message once ready
        await client.sendMessage(m.chat, { delete: loadingMsg.key });

        // Send audio (MP3)
        try {
          await client.sendMessage(
            m.chat,
            {
              audio: { url: audioUrl },
              mimetype: "audio/mpeg",
              fileName: `${filename}.mp3`,
              contextInfo: {
                externalAdReply: {
                  title: filename.substring(0, 30),
                  body: artist.substring(0, 30),
                  thumbnailUrl: song.image || "",
                  sourceUrl: song.external_url || "",
                  mediaType: 1,
                  renderLargerThumbnail: true,
                },
              },
            },
            { quoted: m }
          );
        } catch (audioError) {
          console.error('Audio send failed:', audioError);
        }

        // Send document version with caption
        try {
          await client.sendMessage(
            m.chat,
            {
              document: { url: audioUrl },
              mimetype: "audio/mpeg",
              fileName: `${filename} - ${artist}.mp3`.replace(/[<>:"/\\|?*]/g, '_'),
              caption: formatStylishReply(
                `Spotify Download Complete ✅\nTitle: ${filename}\nArtist: ${artist}\nAlbum: ${album}\nDuration: ${duration}\n\nPowered by ${botname}`
              ),
            },
            { quoted: m }
          );
        } catch (docError) {
          console.error('Document send failed:', docError);
          throw new Error('Failed to send the song file');
        }

        // Image message removed completely ✅

      } else {
        await client.sendMessage(m.chat, { delete: loadingMsg.key });

        await client.sendMessage(m.chat, {
          text: formatStylishReply(`Couldn’t find "${query}" 😩\nTry spelling it better or include the artist name.`)
        }, { quoted: m });
      }

    } catch (error) {
      console.error("Spotify command error:", error);

      try {
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
      } catch (_) {}

      let errorMessage = 'An unexpected error occurred';
      if (error.message.includes('Failed to download')) {
        errorMessage = 'Song download failed. Might be unavailable.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Cannot connect to Spotify service.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Try again later.';
      } else {
        errorMessage = error.message;
      }

      await client.sendMessage(m.chat, {
        text: formatStylishReply(`Download Failed 😤\nSong: "${query}"\nError: ${errorMessage}\n\nTips:\n• Use exact song name\n• Include artist name\n• Check spelling`)
      }, { quoted: m });
    }
  }
};