const fetch = require("node-fetch");

module.exports = {
  name: 'image',
  aliases: ['img', 'pic', 'searchimage'],
  description: 'Searches for images based on your query',
  run: async (context) => {
    const { client, m, prefix } = context;

    const query = m.body.replace(new RegExp(`^${prefix}(image|img|pic|searchimage)\\s*`, 'i'), '').trim();
    if (!query) {
      return client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the search query!\n│❒ Example: ${prefix}image cute cats\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    try {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      const apiUrl = `https://api.nekolabs.web.id/dsc/bing/images?q=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.success || !data.result || data.result.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ No images found for "${query}"! 😢\n│❒ Try a different search term.\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
      }

      const images = data.result.slice(0, 10);
      const cards = [];

      for (const [index, imageUrl] of images.entries()) {
        try {
          const res = await fetch(imageUrl);
          if (!res.ok) continue;
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          let mediaMessage;
          try {
            mediaMessage = await client.sendMessage(m.chat, { 
              image: buffer 
            }, { quoted: m, ephemeralExpiration: 86400 });
            
            if (mediaMessage && mediaMessage.message && mediaMessage.message.imageMessage) {
              const imageMsg = mediaMessage.message.imageMessage;
              
              cards.push({
                title: `Image ${index + 1}`,
                description: `Result ${index + 1} of 10`,
                imageMessage: imageMsg,
                buttons: [
                  {
                    name: "cta_url",
                    buttonParamsJson: JSON.stringify({
                      display_text: "🌐 Open GitHub",
                      url: "https://github.com/xhclintohn/Toxic-MD"
                    })
                  },
                  {
                    name: "cta_copy",
                    buttonParamsJson: JSON.stringify({
                      display_text: "📋 Copy GitHub Link",
                      copy_code: "https://github.com/xhclintohn/Toxic-MD"
                    })
                  }
                ]
              });
            }
          } catch (uploadErr) {
            continue;
          }
        } catch (err) {
          continue;
        }
      }

      if (cards.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Failed to load any images for "${query}"! 😢\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      const carouselMsg = {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: "🎨 Image Search Results"
              },
              body: {
                text: `Found ${cards.length} images for "${query}"\nSwipe right → to browse`
              },
              footer: {
                text: "Powered by Toxic-MD • Tap buttons below"
              },
              carouselMessage: {
                cards: cards.map((card, idx) => ({
                  title: card.title,
                  description: card.description,
                  media: {
                    imageMessage: card.imageMessage
                  },
                  nativeFlowMessage: {
                    buttons: card.buttons
                  }
                }))
              }
            }
          }
        }
      };

      await client.sendMessage(m.chat, carouselMsg, { quoted: m });

    } catch (error) {
      console.error('Image search error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, @${m.sender.split('@')[0]}! 😤 Image search failed!\n│❒ Try again later.\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};