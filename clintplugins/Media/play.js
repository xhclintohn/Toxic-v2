const fs = require("fs");
const path = require("path");
const axios = require("axios");

const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

module.exports = async (context) => {
  const { client, m, text } = context;

  const formatStylishReply = (message) => {
    return `◈━━━━━━━━━━━━━━━━◈\n│❒ ${message}\n◈━━━━━━━━━━━━━━━━◈\n> Pσɯҽɾԃ Ⴆყ Tσxιƈ-ɱԃȥ`;
  };

  const fakeQuoted = {
    key: {
      participant: '0@s.whatsapp.net',
      remoteJid: '0@s.whatsapp.net',
      id: m.id
    },
    message: {
      conversation: "Toxic Verified By WhatsApp"
    },
    contextInfo: {
      mentionedJid: [m.sender],
      forwardingScore: 999,
      isForwarded: true
    }
  };

  const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios(url, options);
        if (!response.status === 200) {
          throw new Error(`API failed with status ${response.status}`);
        }
        return response;
      } catch (error) {
        if (attempt === retries || error.code !== "ECONNABORTED") {
          throw error;
        }
        console.error(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  if (!text) {
    return m.reply(formatStylishReply("Yo, drop a song name, fam! 🎵 Ex: .play Alone"));
  }

  if (text.length > 100) {
    return m.reply(formatStylishReply("Keep it short, homie! Song name max 100 chars. 📝"));
  }

  try {
    // Step 1: Search using the playspotify API
    const encodedQuery = encodeURIComponent(text);
    const apiUrl = `https://api.privatezia.biz.id/api/downloader/playspotify?query=${encodedQuery}`;
    const response = await fetchWithRetry(apiUrl, {
      method: "get",
      headers: { Accept: "application/json" },
      timeout: 15000,
    });

    const apiData = response.data;

    // Check if the API call was successful
    if (!apiData.status || !apiData.result || !apiData.result.downloadUrl) {
      throw new Error("API failed to find the song or provide a download URL");
    }

    const { title, artist, thumbnail, downloadUrl, duration } = apiData.result;

    // Step 2: Download the audio file
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.mp3`;
    const filePath = path.join(tempDir, fileName);

    const audioResponse = await axios({
      method: "get",
      url: downloadUrl,
      responseType: "stream",
      timeout: 600000,
    });

    const writer = fs.createWriteStream(filePath);
    audioResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      throw new Error("Download failed or file is empty");
    }

    // Step 3: Send the audio file
    await m.reply(formatStylishReply(`Droppin' *${title}* by *${artist}* for ya, fam! Crank it up! 🔥🎧`));

    await client.sendMessage(
      m.chat,
      {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        fileName: `${title.substring(0, 100)}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: `${artist} | Powered by Toxic-MD`,
            thumbnailUrl: thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: apiData.result.spotifyUrl || "",
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: fakeQuoted }
    );

    // Clean up the temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error("Spotify play error:", error);
    await m.reply(formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another track! 😎`));
  }
};