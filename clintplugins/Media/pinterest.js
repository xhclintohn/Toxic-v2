const fetch = require("node-fetch");
const axios = require("axios");

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pinterestimg'],
  description: 'Fetches Pinterest images based on a search query',
  run: async (context) => {
    const { client, m, prefix } = context;

    const stylish = (msg) =>
      `◈━━━━━━━━━━━━━━━━◈\n│❒ ${msg}\n┗━━━━━━━━━━━━━━━┛`;

    const downloadImageBuffer = async (url, timeout = 20000) => {
      const res = await axios.get(url, { responseType: "arraybuffer", timeout });
      const buffer = Buffer.from(res.data);
      const mime = res.headers["content-type"] || "image/jpeg";
      return { buffer, mime };
    };

    const query = m.body.replace(new RegExp(`^${prefix}(pinterest|pin|pinterestimg)\\s*`, 'i'), '').trim();
    if (!query) {
      return client.sendMessage(m.chat, {
        text: stylish(`Yo, @${m.sender.split('@')[0]}! 😤 You forgot the search term!\nExample: ${prefix}pinterest cats`),
        mentions: [m.sender],
      }, { quoted: m });
    }

    const loadingMsg = await client.sendMessage(m.chat, {
      text: stylish(`Searching Pinterest for "${query}"... 🔍\nHold on a sec!`)
    }, { quoted: m });

    try {
      const apiUrl = `https://api-faa.my.id/faa/pinterest?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.status || !data.result || data.result.length === 0) {
        await client.sendMessage(m.chat, { delete: loadingMsg.key });
        return client.sendMessage(m.chat, {
          text: stylish(`No results found for "${query}" 😢`),
        }, { quoted: m });
      }

      const images = data.result.slice(0, 10); // limit to 10
      await client.sendMessage(m.chat, { delete: loadingMsg.key });

      await client.sendMessage(m.chat, {
        text: stylish(`Found ${images.length} Pinterest images for "${query}"! 📸`)
      }, { quoted: m });

      const album = [];
      let successful = 0;

      for (const [i, imgUrl] of images.entries()) {
        try {
          const { buffer, mime } = await downloadImageBuffer(imgUrl);
          album.push({
            image: buffer,
            mimetype: mime,
            caption: i === 0 ? `Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ Pinterest Search Result\n│❒ Query: _${query}_\n│❒ Image ${i + 1}/${images.length}\n┗━━━━━━━━━━━━━━━┛` : ''
          });
          successful++;
        } catch (err) {
          console.warn(`Failed to download image ${i + 1}: ${err.message}`);
        }
      }

      if (album.length === 0) {
        return client.sendMessage(m.chat, {
          text: stylish(`Couldn't download any images 😔 Try again later.`)
        }, { quoted: m });
      }

      try {
        await client.sendMessage(m.chat, { albumMessage: album }, { quoted: m });
        if (successful < images.length) {
          await client.sendMessage(m.chat, {
            text: stylish(`Sent ${successful}/${images.length} images (some failed to load)`)
          }, { quoted: m });
        }
      } catch (err) {
        console.error("Album send failed:", err);
        // fallback
        let sentCount = 0;
        for (const img of album.slice(0, 5)) {
          try {
            await client.sendMessage(m.chat, {
              image: img.image,
              mimetype: img.mimetype,
              caption: sentCount === 0
                ? `Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ\n\n◈━━━━━━━━━━━━━━━━◈\n│❒ Pinterest Search Results\n│❒ Query: _${query}_\n┗━━━━━━━━━━━━━━━┛`
                : ''
            }, { quoted: m });
            sentCount++;
            await new Promise(r => setTimeout(r, 1000));
          } catch (e) {
            console.warn("Failed to send single image:", e.message);
          }
        }
      }

    } catch (err) {
      console.error("Pinterest error:", err);
      await client.sendMessage(m.chat, {
        text: stylish(`⚠️ Oops, @${m.sender.split('@')[0]}! Error: ${err.message}`),
        mentions: [m.sender]
      }, { quoted: m });
    }
  }
};