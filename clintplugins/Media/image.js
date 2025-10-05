const axios = require("axios");

module.exports = async (context) => {
  const { client, m, text } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
  };

  // Helper: download image into a Buffer (returns { buffer, mime } or throws)
  const downloadImageBuffer = async (url, timeout = 20000) => {
    const res = await axios.get(url, { responseType: "arraybuffer", timeout });
    const buffer = Buffer.from(res.data);
    const mime = res.headers["content-type"] || "image/jpeg";
    return { buffer, mime };
  };

  try {
    if (!text || !String(text).trim()) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("Yo, supply something to search, idiot. Example: .image cute cat") },
        { quoted: m, ad: true }
      );
    }

    // Inform the user we're searching (toxic tone)
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Aight ${m.pushName || "mate"}, scraping the web for: "${text}". Don't get excited.`) },
      { quoted: m, ad: true }
    );

    // Query GiftedTech image search API
    const apiUrl = `https://api.giftedtech.co.ke/api/search/googleimage?apikey=gifted&query=${encodeURIComponent(text)}`;
    const resp = await axios.get(apiUrl, { timeout: 15000 });

    if (!resp.data || !resp.data.results || !Array.isArray(resp.data.results) || resp.data.results.length === 0) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("No images found, brainiac. Try another search.") },
        { quoted: m, ad: true }
      );
    }

    const allImages = resp.data.results;
    // Send up to this many images (adjust if you want fewer/more)
    const MAX_SEND = 5;
    const imagesToSend = allImages.slice(0, MAX_SEND);

    // Notify how many we'll send
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Found ${allImages.length} images — sending ${imagesToSend.length}. Don't beg for more.`) },
      { quoted: m, ad: true }
    );

    let sentCount = 0;
    for (const imgUrl of imagesToSend) {
      try {
        // Download image into buffer so WhatsApp receives actual image data (not a link)
        const { buffer, mime } = await downloadImageBuffer(imgUrl);

        // Prepare caption with toxic flavor and minimal metadata
        const caption = formatStylishReply(`🔎 Search: ${text}\n🌐 Source: Toxic-MD\n🖼 Image ${sentCount + 1}/${imagesToSend.length}`);

        await client.sendMessage(
          m.chat,
          {
            image: buffer,
            mimetype: mime,
            caption,
          },
          { quoted: m }
        );

        sentCount++;
      } catch (e) {
        
        console.warn(`image.js: failed to download/send image "${imgUrl}" —`, e.message || e);
        // Try fallback: send as URL (if buffer sending fails for this URL)
        try {
          await client.sendMessage(
            m.chat,
            {
              image: { url: imgUrl },
              caption: formatStylishReply(`🔎 Fallback send for: ${text}\n🌐 Source: Toxic-MD\n🖼 Image ${sentCount + 1}/${imagesToSend.length}`),
            },
            { quoted: m }
          );
          sentCount++;
        } catch (e2) {
          console.warn("image.js: fallback send also failed:", e2.message || e2);
        }
      }
    }

    if (sentCount === 0) {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply("Alright, everything failed. The web is cursed today. Try another query later.") },
        { quoted: m, ad: true }
      );
    } else {
      await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`All done. Sent ${sentCount} image(s). Don't waste them.`) },
        { quoted: m, ad: true }
      );
    }
  } catch (error) {
    console.error("image.js error:", error);
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${error.message || error}. Try again or pick another search.`) },
      { quoted: m, ad: true }
    );
  }
};