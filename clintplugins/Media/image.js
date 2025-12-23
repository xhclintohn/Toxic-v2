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

    const query = m.body.replace(new RegExp(`^${prefix}(image|img|pic|searchimage)\\s*`, 'i'), '').trim();
    if (!query) {
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the search query!\n│❒ Example: ${prefix}image cute cats\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    try {
      const loadingMsg = await client.sendMessage(m.chat, {
        text: formatStylishReply(`Searching for images of: "${query}"... 🔍\nHold tight!`)
      }, { quoted: m });

      const apiUrl = `https://anabot.my.id/api/search/gimage?query=${encodeURIComponent(query)}&apikey=freeApikey`;
      const response = await fetchWithRetry(apiUrl, { timeout: 15000 });
      const data = await response.json();

      if (!data.success || !data.data?.result || data.data.result.length === 0) {
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        return client.sendMessage(m.chat, {
          text: formatStylishReply(`No images found for "${query}"! 😢\nTry a different search term.`)
        }, { quoted: m });
      }

      const images = data.data.result.slice(0, 10);

      await client.sendMessage(m.chat, { delete: loadingMsg.key });

      await client.sendMessage(m.chat, {
        text: formatStylishReply(`Found \( {data.data.result.length} images for " \){query}"!\nSwipe the carousel below 👉`)
      }, { quoted: m });

      const cards = [];

      for (const [index, image] of images.entries()) {
        try {
          const { buffer } = await downloadImageBuffer(image.url);

          const mediaMessage = await client.prepareWAMessageMedia(
            { image: buffer },
            { upload: client.waUploadToServer }
          );

          cards.push({
            header: {
              title: `Image ${index + 1}`,
              subtitle: `${image.width} × ${image.height}`,
              hasMediaAttachment: true,
              imageMessage: mediaMessage.imageMessage
            },
            body: {
              text: `Result ${index + 1} of ${images.length}`
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Copy Image URL",
                    copy_code: image.url
                  })
                }
              ]
            }
          });
        } catch (err) {
          console.warn(`Failed to process image ${index + 1}:`, err.message);
        }
      }

      if (cards.length === 0) {
        return client.sendMessage(m.chat, {
          text: formatStylishReply(`Failed to load any images for "${query}"! 😢`)
        }, { quoted: m });
      }

      const carouselMsg = {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: "🎨 Image Search Results"
              },
              body: {
                text: `Swipe to view \( {cards.length} images for " \){query}"`
              },
              footer: {
                text: "Powered by Toxic-MD"
              },
              carouselMessage: {
                cards
              }
            }
          }
        }
      };

      await client.sendMessage(m.chat, carouselMsg, { quoted: m });

    } catch (error) {
      console.error('Image search error:', error);
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, @${m.sender.split('@')[0]}! 😤 Image search failed!\n│❒ Error: ${error.message}\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};