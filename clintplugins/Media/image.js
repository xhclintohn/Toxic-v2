const fetch = require("node-fetch");
const axios = require("axios");

module.exports = {
  name: 'image',
  aliases: ['img', 'pic', 'searchimage'],
  description: 'Searches for images based on your query',
  run: async (context) => {
    const { client, m, prefix, botname } = context;

    const formatStylishReply = (message) => {
      return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n┗━━━━━━━━━━━━━━━┛`;
    };

    // Helper: Download image into a Buffer
    const downloadImageBuffer = async (url, timeout = 20000) => {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout });
      const buffer = Buffer.from(res.data);
      const mime = res.headers["content-type"] || "image/jpeg";
      return { buffer, mime };
    };

    const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`API failed with status ${response.status}`);
          }
          return response;
        } catch (error) {
          if (attempt === retries) {
            throw error;
          }
          console.error(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    /**
     * Extract search query from message
     */
    const query = m.body.replace(new RegExp(`^${prefix}(image|img|pic|searchimage)\\s*`, 'i'), '').trim();
    if (!query) {
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the search query!\n│❒ Example: ${prefix}image cute cats\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    try {
      /**
       * Send loading message
       */
      const loadingMsg = await client.sendMessage(m.chat, {
        text: formatStylishReply(`Searching for images of: "${query}"... 🔍\nHold tight!`)
      }, { quoted: m });

      /**
       * Call the Google Images API
       */
      const apiUrl = `https://anabot.my.id/api/search/gimage?query=${encodeURIComponent(query)}&apikey=freeApikey`;
      const response = await fetchWithRetry(apiUrl, { timeout: 15000 });
      const data = await response.json();

      /**
       * Validate API response
       */
      if (!data.success || !data.data?.result || data.data.result.length === 0) {
        await client.sendMessage(m.chat, { 
          delete: loadingMsg.key 
        });
        return client.sendMessage(m.chat, {
          text: formatStylishReply(`No images found for "${query}"! 😢\nTry a different search term.`)
        }, { quoted: m });
      }

      /**
       * Get images from response (limit to 10 for performance)
       */
      const images = data.data.result.slice(0, 10);
      
      // Delete loading message
      await client.sendMessage(m.chat, { 
        delete: loadingMsg.key 
      });

      /**
       * Send success message
       */
      await client.sendMessage(m.chat, {
        text: formatStylishReply(`Found ${data.data.result.length} images for "${query}"!\nSending ${images.length} best results... 📸`)
      }, { quoted: m });

      /**
       * Prepare and send image album
       */
      const albumImages = [];
      let successfulDownloads = 0;

      for (const [index, image] of images.entries()) {
        try {
          // Download image into buffer
          const { buffer, mime } = await downloadImageBuffer(image.url);
          
          // Prepare caption for each image
          const caption = `◈━━━━━━━━━━━━━━━━◈\n│❒ *Image Search Result*\n│❒ Query: _${query}_\n│❒ Size: ${image.width}x${image.height}\n│❒ Image ${index + 1}/${images.length}\n│❒ Powered by *${botname}*\n┗━━━━━━━━━━━━━━━┛`;

          // Add to album
          albumImages.push({
            image: buffer,
            mimetype: mime,
            caption: index === 0 ? caption : '' // Only caption first image to avoid spam
          });

          successfulDownloads++;
        } catch (error) {
          console.warn(`Failed to download image ${index + 1}:`, error.message);
          // Continue with other images even if one fails
        }
      }

      if (albumImages.length === 0) {
        return client.sendMessage(m.chat, {
          text: formatStylishReply(`Failed to download any images for "${query}"! 😢\nThe images might be temporarily unavailable.`)
        }, { quoted: m });
      }

      /**
       * Send album message
       */
      try {
        await client.sendMessage(
          m.chat,
          {
            albumMessage: albumImages
          },
          { quoted: m }
        );

        // Send completion message
        if (successfulDownloads < images.length) {
          await client.sendMessage(m.chat, {
            text: formatStylishReply(`Sent ${successfulDownloads} images for "${query}"!\n(${images.length - successfulDownloads} failed to load)`)
          }, { quoted: m });
        }

      } catch (albumError) {
        console.error("Failed to send album, trying individual images:", albumError);
        
        // Fallback: send images individually
        let individualSentCount = 0;
        for (const img of albumImages.slice(0, 5)) { // Limit to 5 for individual sending
          try {
            await client.sendMessage(
              m.chat,
              {
                image: img.image,
                mimetype: img.mimetype,
                caption: individualSentCount === 0 ? `◈━━━━━━━━━━━━━━━━◈\n│❒ *Image Search Results*\n│❒ Query: _${query}_\n│❒ Powered by *${botname}*\n┗━━━━━━━━━━━━━━━┛` : ''
              },
              { quoted: m }
            );
            individualSentCount++;
            // Small delay between sends
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            console.warn("Failed to send individual image:", e.message);
          }
        }

        if (individualSentCount > 0) {
          await client.sendMessage(m.chat, {
            text: formatStylishReply(`Sent ${individualSentCount} images individually for "${query}"!`)
          }, { quoted: m });
        } else {
          throw new Error("All sending methods failed");
        }
      }

    } catch (error) {
      console.error('Image search error:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, @${m.sender.split('@')[0]}! 😤 Image search failed!\n│❒ Error: ${error.message}\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};