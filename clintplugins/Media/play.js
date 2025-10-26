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

  if (!text) {
    return m.reply(formatStylishReply("Yo, drop a song name, fam! 🎵 Ex: .play Alone"));
  }

  if (text.length > 100) {
    return m.reply(formatStylishReply("Keep it short, homie! Song name max 100 chars. 📝"));
  }

  try {
    const apiUrl = `https://www.joocode.zone.id/api/music?query=${encodeURIComponent(text)}`;

    // Call the Joocode API
    const response = await axios.get(apiUrl);
    const apiData = response.data;

    // Check if the API call was successful
    if (apiData.error || !apiData.raw || !apiData.raw.status || !apiData.raw.download) {
      throw new Error(apiData.error || "API failed to fetch song data");
    }

    const songData = apiData.raw;
    const timestamp = Date.now();
    const fileName = `audio_${timestamp}.mp3`;
    const filePath = path.join(tempDir, fileName);

    // Download the audio file from the API's download URL
    const audioResponse = await axios({
      method: "get",
      url: songData.download,
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

    await m.reply(formatStylishReply(`Droppin' *${songData.title}* by ${songData.artist} for ya, fam! Crank it up! 🔥🎧`));

    await client.sendMessage(
      m.chat,
      {
        audio: { url: filePath },
        mimetype: "audio/mpeg",
        fileName: `${songData.title.substring(0, 100)}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: songData.title,
            body: `${songData.artist} | Powered by Toxic-MD`,
            thumbnailUrl: songData.thumbnail || "https://via.placeholder.com/120x90",
            sourceUrl: songData.spotify_url,
            mediaType: 1,
            renderLargerThumbnail: true,
          },
        },
      },
      { quoted: fakeQuoted }
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    await m.reply(formatStylishReply(`Yo, we hit a snag: ${error.message}. Pick another track! 😎`));
  }
};