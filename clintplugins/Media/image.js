const fetch = require("node-fetch");
const { generateWAMessageContent, generateWAMessageFromContent } = require("@whiskeysockets/baileys");

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
          const messageContent = await generateWAMessageContent(
            { image: { url: imageUrl } }, 
            { upload: client.waUploadToServer }
          );
          
          if (!messageContent || !messageContent.imageMessage) {
            console.warn(`Failed to generate content for image ${index + 1}`);
            continue;
          }

          cards.push({
            header: {
              title: `Image ${index + 1}`,
              hasMediaAttachment: true,
              imageMessage: messageContent.imageMessage
            },
            body: {
              text: `Result ${index + 1} of 10`
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Open Image",
                    url: imageUrl
                  })
                },
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: "Copy Image URL",
                    copy_code: imageUrl
                  })
                }
              ]
            }
          });
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (err) {
          console.warn(`Failed to process image ${index + 1}:`, err.message);
        }
      }

      if (cards.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Failed to load any images for "${query}"! 😢\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      const message = generateWAMessageFromContent(
        m.chat,
        {
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2,
              },
              interactiveMessage: {
                header: {
                  title: "🎨 Image Search Results"
                },
                body: {
                  text: `Swipe to view the first ${cards.length} images for "${query}"`
                },
                footer: {
                  text: "Powered by Toxic-MD"
                },
                carouselMessage: {
                  cards: cards
                }
              }
            }
          }
        },
        { quoted: m }
      );

      await client.relayMessage(m.chat, message.message, { messageId: message.key.id });

    } catch (error) {
      console.error('Image search error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendMessage(m.chat, {
        text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Oops, @${m.sender.split('@')[0]}! 😤 Image search failed!\n│❒ Error: ${error.message}\n│❒ Try again later.\n┗━━━━━━━━━━━━━━━┛`,
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};