import axios from 'axios';
import * as cheerio from 'cheerio';
import { getFakeQuoted } from '../../lib/fakeQuoted.js';

export default async (context) => {
  const { client, m, text } = context;
  const fq = getFakeQuoted(m);

  if (!text) {
    return m.reply("╭───(    TOXIC-MD    )───\n├ You forgot the query, dumbass.\n├ Try: .wallpaper anime girl, 5\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧");
  }

  let query, count;
  if (text.includes(',')) {
    const [q, c] = text.split(',');
    query = q.trim();
    count = parseInt(c.trim()) || 5;
  } else {
    query = text.trim();
    count = 5;
  }

  if (count > 20) count = 20;

  try {
    await client.sendMessage(m.chat, { react: { text: '⌛', key: m.reactKey } });

    const results = await fetchWallpapers(query);

    if (results.length === 0) {
      await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
      return m.reply(`╭───(    TOXIC-MD    )───\n├ No wallpapers found for "${query}". Your taste sucks.\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
    }

    const toSend = results.slice(0, count);

    for (let i = 0; i < toSend.length; i++) {
      const wp = toSend[i];
      const caption = `╭───(    TOXIC-MD    )───\n├───≫ WALLPAPER ${i + 1}/${toSend.length} ≪───\n├ \n` +
                      `├ Title: ${wp.title || 'Untitled'}\n` +
                      `├ Resolution: ${wp.resolution || 'Unknown'}\n` +
                      `├ Desc: ${wp.description || 'No description'}\n` +
                      `├ Link: ${wp.link || 'N/A'}\n` +
                      `╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`;

      await client.sendMessage(m.chat, {
        image: { url: wp.image },
        caption,
      }, { quoted: fq });

      if (i < toSend.length - 1) await new Promise(res => setTimeout(res, 1500));
    }

    await client.sendMessage(m.chat, { react: { text: '✅', key: m.reactKey } });
  } catch (err) {
    console.error('Wallpaper error:', err);
    await client.sendMessage(m.chat, { react: { text: '❌', key: m.reactKey } });
    m.reply(`╭───(    TOXIC-MD    )───\n├───≫ WALLPAPER ERROR ≪───\n├ \n├ Failed to fetch wallpapers. Site's probably dead.\n├ ${err.message}\n╰──────────────────☉\n> ©𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐱𝐡_𝐜𝐥𝐢𝐧𝐭𝐨𝐧`);
  }
};

async function fetchWallpapers(query) {
  const searchUrl = `https://www.uhdpaper.com/search?q=${encodeURIComponent(query)}&by-date=true`;

  const { data } = await axios.get(searchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
    },
    timeout: 30000
  });

  const $ = cheerio.load(data);
  const results = [];

  $('.post-outer').each((_, el) => {
    const title = $(el).find('h2').text().trim() || null;
    const resolution = $(el).find('b').text().trim() || null;
    let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
    if (image && image.startsWith('//')) image = 'https:' + image;
    const description = $(el).find('p').text().trim() || null;
    const link = $(el).find('a').attr('href');
    if (image) {
      results.push({ title, resolution, image, description, source: 'uhdpaper.com', link: link ? 'https://www.uhdpaper.com' + link : null });
    }
  });

  return results;
}
