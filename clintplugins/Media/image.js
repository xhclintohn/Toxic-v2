const fetch = require("node-fetch");
const { generateWAMessageContent, generateWAMessageFromContent, getContentType } = require("@whiskeysockets/baileys");

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
          console.log(`Processing image ${index + 1}: ${imageUrl}`);
          
          // First, download the image
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            console.warn(`Failed to download image ${index + 1}: HTTP ${imageResponse.status}`);
            continue;
          }
          
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          if (!buffer || buffer.length === 0) {
            console.warn(`Empty buffer for image ${index + 1}`);
            continue;
          }

          // Upload the image directly using waUploadToServer
          const uploaded = await client.waUploadToServer({
            image: buffer
          }).catch(e => {
            console.warn(`Upload failed for image ${index + 1}:`, e.message);
            return null;
          });

          if (!uploaded) {
            console.warn(`Upload result empty for image ${index + 1}`);
            continue;
          }

        
          const imageMessage = {
            url: uploaded.url || imageUrl,
            mimetype: "image/jpeg",
            fileSha256: uploaded.fileSha256,
            fileLength: uploaded.fileLength,
            height: 720,
            width: 1280,
            mediaKey: uploaded.mediaKey,
            fileEncSha256: uploaded.fileEncSha256,
            directPath: uploaded.directPath,
            mediaKeyTimestamp: Math.floor(Date.now() / 1000),
            jpegThumbnail: uploaded.jpegThumbnail || buffer.toString('base64').slice(0, 100)
          };

          cards.push({
            header: {
              title: `Image ${index + 1}`,
              hasMediaAttachment: true,
              imageMessage: imageMessage
            },
            body: {
              text: `Result ${index + 1} of 10`
            },
            nativeFlowMessage: {
              buttons: [
                {
                  name: "cta_url",
                  buttonParamsJson: JSON.stringify({
                    display_text: "🌐 Open Image",
                    url: imageUrl
                  })
                },
                {
                  name: "cta_copy",
                  buttonParamsJson: JSON.stringify({
                    display_text: "📋 Copy URL",
                    copy_code: imageUrl
                  })
                }
              ]
            }
          });
          
          console.log(`Successfully added image ${index + 1} to carousel`);
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

      // Try alternative approach if carousel fails
      try {
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
                    text: "Powered by Toxic-MD • Click buttons to interact"
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
        
      } catch (carouselError) {
        console.error('Carousel failed, sending images separately:', carouselError);
        
     
        await client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Found ${images.length} images for "${query}"\n│❒ Here are the first 3:\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
        
        for (let i = 0; i < Math.min(3, images.length); i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            await client.sendMessage(m.chat, {
              image: { url: images[i] },
              caption: `📸 Image ${i + 1} of ${images.length}`
            });
          } catch (e) {
            console.warn(`Failed to send image ${i + 1}:`, e.message);
          }
        }
      }

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