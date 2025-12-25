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
      
      // Create product list sections for horizontal scrolling
      const productSections = [];
      const singleProducts = [];

      for (const [index, imageUrl] of images.entries()) {
        try {
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error('Bad response');
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Upload image to WhatsApp servers
          const uploaded = await client.waUploadToServer({ 
            image: buffer,
            mimetype: 'image/jpeg'
          });

          // Create product entry for horizontal carousel
          const product = {
            productId: `img_${Date.now()}_${index}`,
            title: `Image ${index + 1}`,
            description: `Search result for: ${query}`,
            currencyCode: "USD",
            priceAmount1000: 0,
            retailerId: `image_${index}`,
            url: imageUrl,
            productImageCount: 1,
            firstImageId: uploaded.imageMessage ? "1" : undefined
          };

          // For multi-product display (horizontal scroll)
          singleProducts.push({
            product: product,
            body: `Image ${index + 1} of ${images.length}`,
            footer: `Powered by Toxic-MD • Click "View" to see full image`,
            imageMessage: uploaded.imageMessage
          });

          // Add to product sections
          productSections.push({
            title: `Result ${index + 1}`,
            products: [product]
          });

        } catch (err) {
          console.warn(`Failed to process image ${index + 1}:`, err.message);
        }
      }

      if (singleProducts.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `◈━━━━━━━━━━━━━━━━◈\n│❒ Failed to load any images for "${query}"! 😢\n┗━━━━━━━━━━━━━━━┛`
        }, { quoted: m });
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      // METHOD 1: Using Catalog Message (for horizontal scroll)
      // This creates the swipeable product list you mentioned
      const catalogMsg = {
        product: {
          product: {
            title: `🎨 Image Search: ${query}`,
            description: `Found ${singleProducts.length} images • Swipe right to browse`,
            currencyCode: "USD",
            priceAmount1000: 0,
            retailerId: "image_search",
            url: "",
            productImageCount: singleProducts.length,
            salePriceAmount1000: 0,
            firstImageId: "1"
          },
          businessOwnerJid: m.chat,
          catalog: {
            catalogImage: singleProducts[0]?.imageMessage,
            title: `Image Search Results`,
            productCount: singleProducts.length,
            products: singleProducts.map(p => ({
              productId: p.product.productId,
              title: p.product.title,
              description: p.product.description,
              currencyCode: p.product.currencyCode,
              priceAmount1000: p.product.priceAmount1000,
              retailerId: p.product.retailerId,
              url: p.product.url,
              productImageCount: 1
            }))
          },
          body: `Swipe right to browse ${singleProducts.length} images`,
          footer: "Powered by Toxic-MD",
          contextInfo: {
            mentionedJid: [m.sender]
          }
        }
      };

      // METHOD 2: Alternative using Interactive Carousel (if catalog doesn't work)
      // This creates cards that can be swiped horizontally
      const carouselMsg = {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: {
                title: `🎨 Image Search: ${query}`
              },
              body: {
                text: `Found ${singleProducts.length} images\nSwipe right to browse results →`
              },
              footer: {
                text: "Powered by Toxic-MD • Tap 'View Image' for details"
              },
              carouselMessage: {
                cards: singleProducts.map((product, index) => ({
                  title: `Image ${index + 1}`,
                  description: `Result ${index + 1} of ${singleProducts.length}`,
                  media: product.imageMessage,
                  buttons: [
                    {
                      buttonId: `view_${index}`,
                      buttonText: {
                        displayText: "🔍 View Image"
                      },
                      type: 1
                    },
                    {
                      buttonId: `copy_${index}`,
                      buttonText: {
                        displayText: "📋 Copy URL"
                      },
                      type: 1
                    }
                  ]
                }))
              }
            }
          }
        }
      };

      // Try sending as catalog message first, fallback to carousel
      try {
        await client.sendMessage(m.chat, catalogMsg, { quoted: m });
      } catch (catalogError) {
        console.log("Catalog message failed, trying carousel:", catalogError.message);
        await client.sendMessage(m.chat, carouselMsg, { quoted: m });
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