const fetch = require("node-fetch");
const { generateWAMessageContent, generateWAMessageFromContent } = require("@whiskeysockets/baileys");
const { getFakeQuoted } = require('../../lib/fakeQuoted');

module.exports = {
  name: 'image',
  aliases: ['img', 'pic', 'searchimage'],
  description: 'Searches for images based on your query',
  run: async (context) => {
    const { client, m, prefix } = context;
    const fq = getFakeQuoted(m);

    const query = m.body.replace(new RegExp(`^${prefix}(image|img|pic|searchimage)\\s*`, 'i'), '').trim();
    if (!query) {
      return client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ Yo, @${m.sender.split('@')[0]}! 😤 You forgot the search query!\n├ Example: ${prefix}image cute cats\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
        mentions: [m.sender]
      }, { quoted: fq });
    }

    try {
      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });

      const apiUrl = `https://api.baguss.xyz/api/search/gimage?q=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (!data.status || !data.result || data.result.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `╭───(    TOXIC-MD    )───\n├ No images found for "${query}"! 😢\n├ Try a different search term.\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
      }

      const images = data.result.slice(0, 10);
      const cards = [];

      for (const [index, img] of images.entries()) {
        try {
          const imageUrl = img.url;
          const res = await fetch(imageUrl);
          if (!res.ok) throw new Error('Image fetch failed');
          const buffer = Buffer.from(await res.arrayBuffer());

          const messageContent = await generateWAMessageContent(
            { image: buffer },
            { upload: client.waUploadToServer }
          );

          if (!messageContent.imageMessage) {
            console.warn(`No imageMessage for ${index + 1}`);
            continue;
          }

          cards.push({
            header: {
              title: `Image ${index + 1}`,
              hasMediaAttachment: true,
              imageMessage: messageContent.imageMessage
            },
            body: {
              text: `Result ${index + 1} of ${images.length}`
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

          await new Promise(resolve => setTimeout(resolve, 800));

        } catch (err) {
          console.warn(`Failed to process image ${index + 1}:`, err.message);
        }
      }

      if (cards.length === 0) {
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return client.sendMessage(m.chat, {
          text: `╭───(    TOXIC-MD    )───\n├ Failed to load any images for "${query}"! 😢\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`
        }, { quoted: fq });
      }

      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      const carouselMsg = generateWAMessageFromContent(
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
                  title: `🎨 Image Search Results for "${query}"`
                },
                body: {
                  text: ""
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
        },
        { quoted: fq }
      );

      await client.relayMessage(m.chat, carouselMsg.message, { messageId: carouselMsg.key.id });

    } catch (error) {
      console.error('Image search error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await client.sendMessage(m.chat, {
        text: `╭───(    TOXIC-MD    )───\n├ Oops, @${m.sender.split('@')[0]}! 😤 Image search failed!\n├ Error: ${error.message}\n├ Try again later.\n╰──────────────────☉
> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`,
        mentions: [m.sender]
      }, { quoted: fq });
    }
  }
};