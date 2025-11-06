module.exports = {
  name: 'spotify',
  aliases: ['spotifydl', 'spoti', 'spt'],
  description: 'Downloads songs from Spotify',
  run: async (context) => {
    const { client, m, prefix, botname, fetchJson } = context;

    const formatStylishReply = (message) => {
      return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈`;
    };

    /**
     * Extract song query from message
     */
    const query = m.body.replace(new RegExp(`^${prefix}(spotify|spotifydl|spoti|spt)\\s*`, 'i'), '').trim();
    
    // Check if song name is provided
    if (!query) {
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 What song you tryna download? 🎶\n│❒ Example: ${prefix}spotify Alone Pt II\n│❒ Or: ${prefix}spoti Alan Walker Ava Max\n◈━━━━━━━━━━━━━━━━◈`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    // Limit query length to keep it chill
    if (query.length > 100) {
      return client.sendMessage(m.chat, {
        text: formatStylishReply("Keep the song name short, homie! Max 100 chars. 📝")
      }, { quoted: m });
    }

    try {
      /**
       * Send loading message
       */
      const loadingMsg = await client.sendMessage(m.chat, {
        text: formatStylishReply(`Searching for "${query}" on Spotify... 🔍\nHold tight! 🎵`)
      }, { quoted: m });

      /**
       * Fetch song from new API
       */
      const apiUrl = `https://api.ootaizumi.web.id/downloader/spotifyplay?query=${encodeURIComponent(query)}`;
      const data = await fetchJson(apiUrl);

      if (data.status && data.result?.download) {
        const song = data.result;
        const audioUrl = song.download;
        const filename = song.title || "Unknown Song";
        const artist = song.artists || "Unknown Artist";
        const album = song.album || "Unknown Album";
        const duration = song.duration_ms ? `${Math.floor(song.duration_ms / 60000)}:${((song.duration_ms % 60000) / 1000).toFixed(0).padStart(2, '0')}` : "Unknown";

        // Delete loading message
        await client.sendMessage(m.chat, { 
          delete: loadingMsg.key 
        });

        /**
         * Send success message with song info
         */
        await client.sendMessage(m.chat, {
          text: formatStylishReply(`Song Found! 🎵\nTitle: *${filename}*\nArtist: ${artist}\nAlbum: ${album}\nDuration: ${duration}\nDownloading now... ⬇️`)
        }, { quoted: m });

        /**
         * Send as audio with metadata
         */
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
          // Continue with document if audio fails
        }

        /**
         * Send as document for better quality
         */
        try {
          await client.sendMessage(
            m.chat,
            {
              document: { url: audioUrl },
              mimetype: "audio/mpeg",
              fileName: `${filename} - ${artist}.mp3`.replace(/[<>:"/\\|?*]/g, '_'),
              caption: formatStylishReply(`Spotify Download 🎧\nTitle: ${filename}\nArtist: ${artist}\nAlbum: ${album}\nPowered by ${botname}`)
            },
            { quoted: m }
          );
        } catch (docError) {
          console.error('Document send failed:', docError);
          throw new Error('Failed to download the song file');
        }

        /**
         * Send song info card with image
         */
        if (song.image) {
          await client.sendMessage(
            m.chat,
            {
              image: { url: song.image },
              caption: formatStylishReply(`${filename} 🎵\nArtist: ${artist}\nAlbum: ${album}\nReleased: ${song.release_date || 'Unknown'}\nDuration: ${duration}\n\nEnjoy your music! 🎧`)
            },
            { quoted: m }
          );
        }

      } else {
        await client.sendMessage(m.chat, { 
          delete: loadingMsg.key 
        });
        
        await client.sendMessage(m.chat, {
          text: formatStylishReply(`No results found for "${query}"! 😢\nTry a different song name or add the artist.`)
        }, { quoted: m });
      }

    } catch (error) {
      console.error("Spotify command error:", error);
      
      // Try to delete loading message
      try {
        await client.sendMessage(m.chat, { 
          delete: loadingMsg.key 
        });
      } catch (e) {
        // Ignore delete errors
      }

      let errorMessage = 'An unexpected error occurred';
      
      if (error.message.includes('Failed to download')) {
        errorMessage = 'Song download failed. The file might be unavailable.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Cannot connect to Spotify service.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Try again later.';
      } else {
        errorMessage = error.message;
      }

      await client.sendMessage(m.chat, {
        text: formatStylishReply(`Download Failed! 😤\nSong: "${query}"\nError: ${errorMessage}\n\nTips:\n• Use exact song name\n• Include artist name\n• Check spelling`)
      }, { quoted: m });
    }
  }
};