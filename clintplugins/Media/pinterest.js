const fetch = require("node-fetch");

module.exports = {
  name: 'pinterest',
  aliases: ['pin', 'pinterestimg'],
  description: 'Fetches Pinterest images based on a search query',
  run: async (context) => {
    const { client, m } = context;

    try {
      const query = m.text.trim();
      if (!query) return m.reply("Give me a search term, you visually impaired fool.");

      await client.sendMessage(m.chat, { react: { text: '⌛', key: m.key } });
      const statusMsg = await m.reply(`Searching Pinterest for "${query}"...`);

      const apiUrl = `https://api-faa.my.id/faa/pinterest?q=${encodeURIComponent(query)}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      if (!data.status || !data.result || data.result.length === 0) {
        await client.sendMessage(m.chat, { delete: statusMsg.key });
        await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        return m.reply(`No Pinterest images found for "${query}". Your search is as pointless as you are.`);
      }

      const images = data.result.slice(0, 10);
      await client.sendMessage(m.chat, { delete: statusMsg.key });
      await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

      const album = [];
      let successful = 0;

      for (const [i, imgUrl] of images.entries()) {
        try {
          const response = await fetch(imgUrl);
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const mime = response.headers.get('content-type') || 'image/jpeg';
          
          album.push({
            image: buffer,
            mimetype: mime,
            caption: i === 0 ? `🥀\n—\nTσxιƈ-ɱԃȥ` : ''
          });
          successful++;
        } catch {}
      }

      if (album.length === 0) {
        return m.reply("Failed to download any images. Pinterest probably blocked your request.");
      }

      await client.sendMessage(m.chat, { albumMessage: album }, { quoted: m });

    } catch (error) {
      console.error('Pinterest error:', error);
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
      await m.reply(`Pinterest search failed. Your query is probably banned.\nError: ${error.message}`);
    }
  }
};