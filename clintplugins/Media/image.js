const fetch = require("node-fetch");
const axios = require("axios");

module.exports = async (context) => {
  const { client, m, text } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
  };

  // Helper: Download image into a Buffer (returns { buffer, mime } or throws)
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
        if (attempt === retries || error.type !== "request-timeout") {
          throw error;
        }
        console.error(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  if (!text) {
    return m.reply(formatStylishReply("Yo, drop a search query, fam! 🔍 Ex: .hentai hinata"));
  }

  try {
    // Step 1: Search using thehentai-search API
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Aight ${m.pushName || "mate"}, scraping the web for: "${text}". Don't get excited.`) },
      { quoted: m, ad: true }
    );

    const encodedQuery = encodeURIComponent(text);
    const searchResponse = await fetchWithRetry(
      `https://api.privatezia.biz.id/api/anime/thehentai-search?query=${encodedQuery}`,
      { headers: { Accept: "application/json" }, timeout: 15000 }
    );

    const searchData = await searchResponse.json();

    // Validate search response
    if (!searchData || !searchData.status || !searchData.data || !searchData.data.posts || searchData.data.posts.length === 0) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("No results found for your query, fam! 😢 Try a different search term.") },
        { quoted: m, ad: true }
      );
    }

    // Get the first result's metadata
    const firstResult = searchData.data.posts[0];
    const contentUrl = firstResult.url;
    const title = firstResult.title || "No title available";
    const thumbnail = firstResult.imgSrc || null;
    const views = firstResult.views || "Unknown";
    const date = firstResult.date || "Unknown";

    // Step 2: Fetch gallery using thehentai-download API
    const encodedContentUrl = encodeURIComponent(contentUrl);
    const downloadResponse = await fetchWithRetry(
      `https://api.privatezia.biz.id/api/anime/thehentai-download?url=${encodedContentUrl}`,
      { headers: { Accept: "application/json" }, timeout: 15000 }
    );

    const downloadData = await downloadResponse.json();

    // Validate download response
    if (!downloadData || !downloadData.status || !downloadData.data || !downloadData.data.gallery || downloadData.data.gallery.length === 0) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("Couldn’t fetch the gallery for this content, fam! 😢 Try again later.") },
        { quoted: m, ad: true }
      );
    }

    const gallery = downloadData.data.gallery;
    const description = downloadData.data.description || "No description available";

    // Notify how many images we'll send
    const MAX_SEND = 50; // Adjustable 🗿
    const imagesToSend = gallery.slice(0, MAX_SEND);
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Found ${gallery.length} images — sending ${imagesToSend.length} in an album. Don't beg for more.`) },
      { quoted: m, ad: true }
    );

    // Step 3: Prepare album message
    const albumImages = [];
    let sentCount = 0;

    for (const [index, img] of imagesToSend.entries()) {
      try {
        // Download image into buffer
        const { buffer, mime } = await downloadImageBuffer(img.imgSrc);

        // Prepare caption for each image
        const caption = formatStylishReply(
          `🎨 Hentai Content\n\n📌 *Title:* ${title}\n📝 *Description:* ${description}\n👀 *Views:* ${views}\n📅 *Date:* ${date}\n🖼 Image ${index + 1}/${imagesToSend.length}`
        );

        // Add to album
        albumImages.push({
          image: buffer,
          mimetype: mime,
          caption
        });

        sentCount++;
      } catch (e) {
        console.warn(`hentai.js: failed to download image "${img.imgSrc}" —`, e.message || e);
        // Skip failed images but continue with others
      }
    }

    if (albumImages.length === 0) {
      return client.sendMessage(
        m.chat,
        { text: formatStylishReply("Alright, everything failed. The web is cursed today. Try another query later.") },
        { quoted: m, ad: true }
      );
    }

    // Step 4: Send album message
    try {
      await client.sendMessage(
        m.chat,
        {
          albumMessage: albumImages
        },
        { quoted: m }
      );

      await client.sendMessage(
        m.chat,
        { text: formatStylishReply(`All done. Sent ${sentCount} image(s) in an album. Don't waste them.`) },
        { quoted: m, ad: true }
      );
    } catch (e) {
      console.error("hentai.js: failed to send album message:", e.message || e);
      // Fallback: send images one by one
      let fallbackSentCount = 0;
      for (const img of albumImages) {
        try {
          await client.sendMessage(
            m.chat,
            {
              image: img.image,
              mimetype: img.mimetype,
              caption: img.caption
            },
            { quoted: m }
          );
          fallbackSentCount++;
        } catch (e2) {
          console.warn("hentai.js: fallback send failed for an image:", e2.message || e2);
        }
      }

      if (fallbackSentCount > 0) {
        await client.sendMessage(
          m.chat,
          { text: formatStylishReply(`Album failed, sent ${fallbackSentCount} image(s) individually. Blame the internet.`) },
          { quoted: m, ad: true }
        );
      } else {
        await client.sendMessage(
          m.chat,
          { text: formatStylishReply("Album and individual sends failed. Try again later, loser.") },
          { quoted: m, ad: true }
        );
      }
    }
  } catch (e) {
    console.error("Hentai fetch error:", e);
    await client.sendMessage(
      m.chat,
      { text: formatStylishReply(`Yo, we hit a snag: ${e.message}. Check your query and try again! 😎`) },
      { quoted: m, ad: true }
    );
  }
};